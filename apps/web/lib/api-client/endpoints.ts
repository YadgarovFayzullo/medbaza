/**
 * Domain calls against the API, typed from the generated schema.
 *
 * Server Components import these directly. Client Components reach them
 * through TanStack Query hooks in `features/<domain>/` (CLAUDE.md §3.8).
 */
import { type GetResponse, type PostResponse, type RequestOptions, request } from './index';

type Options = Pick<RequestOptions, 'token' | 'cache' | 'next' | 'signal'>;

/**
 * Cache tags for the storefront's ISR reads (CLAUDE.md §3.8).
 *
 * Time alone is not a cache strategy: without a tag there is no way to publish
 * a catalog change before the window closes. `POST /api/revalidate` busts these.
 */
export const CACHE_TAGS = {
  catalog: 'catalog',
  categories: 'categories',
  products: 'products',
  product: (slug: string) => `product:${slug}`,
} as const;

const CATALOG_TTL = 300;

/**
 * Merge an endpoint's caching default with what the caller asked for, letting
 * the caller win. Spreading `next` after `...options` — the previous shape —
 * meant a caller could not opt out, and `cache: 'no-store'` collided with the
 * hardcoded `revalidate`.
 */
function cached(tags: string[], options: Options): Options {
  if (options.cache === 'no-store') return options;
  return { ...options, next: { revalidate: CATALOG_TTL, tags, ...options.next } };
}

// --- catalog ---------------------------------------------------------------

export type CategoryTree = GetResponse<'/api/v1/categories'>[number];
export type ProductPage = GetResponse<'/api/v1/products'>;
export type ProductListItem = ProductPage['items'][number];
export type Product = GetResponse<'/api/v1/products/{slug}'>;
export type SearchSuggestions = GetResponse<'/api/v1/search/suggest'>;
export type ReviewPage = GetResponse<'/api/v1/products/{slug}/reviews'>;
export type SellerProfile = GetResponse<'/api/v1/sellers/{slug}'>;

export interface ProductQuery {
  q?: string;
  category?: string;
  brand?: string;
  certification?: string;
  min_price_minor?: number;
  max_price_minor?: number;
  in_stock?: boolean;
  prescription_required?: boolean;
  on_sale?: boolean;
  seller?: string;
  sort?: string;
  limit?: number;
  cursor?: string;
}

export const catalog = {
  categories: (options: Options = {}) =>
    request<CategoryTree[]>(
      '/categories',
      cached([CACHE_TAGS.catalog, CACHE_TAGS.categories], options),
    ),

  products: (query: ProductQuery = {}, options: Options = {}) =>
    request<ProductPage>('/products', {
      query: { ...query },
      ...cached([CACHE_TAGS.catalog, CACHE_TAGS.products], options),
    }),

  product: (slug: string, options: Options = {}) =>
    request<Product>(
      `/products/${slug}`,
      cached([CACHE_TAGS.catalog, CACHE_TAGS.product(slug)], options),
    ),

  related: (slug: string, options: Options = {}) =>
    request<ProductListItem[]>(
      `/products/${slug}/related`,
      cached([CACHE_TAGS.catalog, CACHE_TAGS.products], options),
    ),

  brands: (category?: string, options: Options = {}) =>
    request<string[]>('/products/brands', {
      query: { category },
      ...cached([CACHE_TAGS.catalog, CACHE_TAGS.products], options),
    }),

  suggest: (q: string, options: Options = {}) =>
    request<SearchSuggestions>('/search/suggest', { query: { q }, ...options }),

  reviews: (slug: string, cursor?: string, options: Options = {}) =>
    request<ReviewPage>(`/products/${slug}/reviews`, { query: { cursor }, ...options }),

  createReview: (
    slug: string,
    body: { rating: number; title?: string | null; body?: string },
    options: Options = {},
  ) =>
    request<ReviewPage['items'][number]>(`/products/${slug}/reviews`, {
      method: 'POST',
      body,
      ...options,
    }),

  seller: (slug: string, options: Options = {}) =>
    request<SellerProfile>(`/sellers/${slug}`, options),
};

// --- cart ------------------------------------------------------------------

export type Cart = GetResponse<'/api/v1/cart'>;
export type CartItem = Cart['groups'][number]['items'][number];

// --- orders ----------------------------------------------------------------

export type Order = GetResponse<'/api/v1/orders/{order_id}'>;
export type OrderPage = GetResponse<'/api/v1/orders'>;
export type OrderListItem = OrderPage['items'][number];
export type Shipment = Order['shipments'][number];
export type Address = GetResponse<'/api/v1/account/addresses'>[number];
export type AddressInput = Order['shipping_address'];
export type CheckoutResponse = PostResponse<'/api/v1/checkout'>;

export const orders = {
  list: (token: string, cursor?: string) =>
    request<OrderPage>('/orders', { token, query: { cursor }, cache: 'no-store' }),

  get: (token: string, orderId: string) =>
    request<Order>(`/orders/${orderId}`, { token, cache: 'no-store' }),

  lookup: (number: string, email: string) =>
    request<Order>('/orders/lookup', { query: { number, email }, cache: 'no-store' }),

  cancel: (token: string, orderId: string, reason: string) =>
    request<Order>(`/orders/${orderId}/cancel`, { method: 'POST', body: { reason }, token }),

  requestReturn: (token: string, shipmentId: string, reason: string) =>
    request<Shipment>(`/orders/shipments/${shipmentId}/return`, {
      method: 'POST',
      body: { reason },
      token,
    }),
};

export const account = {
  addresses: (token: string) =>
    request<Address[]>('/account/addresses', { token, cache: 'no-store' }),

  createAddress: (token: string, body: Record<string, unknown>) =>
    request<Address>('/account/addresses', { method: 'POST', body, token }),

  deleteAddress: (token: string, addressId: string) =>
    request<{ ok: boolean }>(`/account/addresses/${addressId}`, { method: 'DELETE', token }),
};

// --- prescriptions ---------------------------------------------------------

export type PrescriptionPage = GetResponse<'/api/v1/prescriptions'>;
export type Prescription = PrescriptionPage['items'][number];

export const prescriptions = {
  list: (token: string, cursor?: string) =>
    request<PrescriptionPage>('/prescriptions', { token, query: { cursor }, cache: 'no-store' }),

  upload: (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Prescription>('/prescriptions', { method: 'POST', formData, token });
  },

  downloadLink: (token: string, prescriptionId: string) =>
    request<{ url: string; expires_in: number }>(`/prescriptions/${prescriptionId}/download-link`, {
      method: 'POST',
      token,
    }),
};

// --- seller ----------------------------------------------------------------

export type SellerAccount = GetResponse<'/api/v1/seller/me'>;
export type SellerStats = GetResponse<'/api/v1/seller/stats'>;
export type PayoutStatus = GetResponse<'/api/v1/seller/payouts'>;
export type SellerShipmentPage = GetResponse<'/api/v1/seller/shipments'>;
export type SellerShipmentListItem = SellerShipmentPage['items'][number];
export type SellerShipment = GetResponse<'/api/v1/seller/shipments/{shipment_id}'>;

export const seller = {
  me: (token: string) => request<SellerAccount>('/seller/me', { token, cache: 'no-store' }),

  stats: (token: string) => request<SellerStats>('/seller/stats', { token, cache: 'no-store' }),

  payouts: (token: string) =>
    request<PayoutStatus>('/seller/payouts', { token, cache: 'no-store' }),

  products: (token: string, query: { status?: string; q?: string; cursor?: string } = {}) =>
    request<ProductPage>('/seller/products', { token, query, cache: 'no-store' }),

  product: (token: string, productId: string) =>
    request<Product>(`/seller/products/${productId}`, { token, cache: 'no-store' }),

  createProduct: (token: string, body: Record<string, unknown>) =>
    request<Product>('/seller/products', { method: 'POST', body, token }),

  updateProduct: (token: string, productId: string, body: Record<string, unknown>) =>
    request<Product>(`/seller/products/${productId}`, { method: 'PATCH', body, token }),

  archiveProduct: (token: string, productId: string) =>
    request<Product>(`/seller/products/${productId}`, { method: 'DELETE', token }),

  setStock: (token: string, productId: string, stock: number) =>
    request<ProductListItem>('/seller/inventory', {
      method: 'PUT',
      body: { product_id: productId, stock },
      token,
    }),

  shipments: (token: string, query: { status?: string; cursor?: string } = {}) =>
    request<SellerShipmentPage>('/seller/shipments', { token, query, cache: 'no-store' }),

  shipment: (token: string, shipmentId: string) =>
    request<SellerShipment>(`/seller/shipments/${shipmentId}`, { token, cache: 'no-store' }),

  transition: (
    token: string,
    shipmentId: string,
    body: { to_status: string; carrier?: string; tracking_number?: string; reason?: string },
  ) =>
    request<SellerShipment>(`/seller/shipments/${shipmentId}/transition`, {
      method: 'POST',
      body,
      token,
    }),

  apply: (token: string, body: Record<string, unknown>) =>
    request<SellerAccount>('/sellers/apply', { method: 'POST', body, token }),
};

// --- admin -----------------------------------------------------------------

export type AdminStats = GetResponse<'/api/v1/admin/stats'>;
export type AdminSellerPage = GetResponse<'/api/v1/admin/sellers'>;
export type AdminSeller = AdminSellerPage['items'][number];
export type AdminOrderPage = GetResponse<'/api/v1/admin/orders'>;
export type AdminUserPage = GetResponse<'/api/v1/admin/users'>;
export type AdminUser = AdminUserPage['items'][number];
export type AdminPrescriptionPage = GetResponse<'/api/v1/admin/prescriptions'>;
export type AuditPage = GetResponse<'/api/v1/admin/audit'>;

export const admin = {
  stats: (token: string) => request<AdminStats>('/admin/stats', { token, cache: 'no-store' }),

  sellers: (token: string, query: { status?: string; cursor?: string } = {}) =>
    request<AdminSellerPage>('/admin/sellers', { token, query, cache: 'no-store' }),

  setVerification: (token: string, sellerId: string, body: { status: string; reason?: string }) =>
    request<AdminSeller>(`/admin/sellers/${sellerId}/verification`, {
      method: 'POST',
      body,
      token,
    }),

  orders: (token: string, query: { status?: string; cursor?: string } = {}) =>
    request<AdminOrderPage>('/admin/orders', { token, query, cache: 'no-store' }),

  order: (token: string, orderId: string) =>
    request<Order>(`/admin/orders/${orderId}`, { token, cache: 'no-store' }),

  transitionShipment: (
    token: string,
    shipmentId: string,
    body: { to_status: string; reason?: string },
  ) => request<Order>(`/admin/shipments/${shipmentId}/transition`, { method: 'POST', body, token }),

  prescriptions: (token: string, cursor?: string) =>
    request<AdminPrescriptionPage>('/admin/prescriptions', {
      token,
      query: { cursor },
      cache: 'no-store',
    }),

  reviewPrescription: (
    token: string,
    prescriptionId: string,
    body: { status: string; reason?: string },
  ) =>
    request<Prescription>(`/admin/prescriptions/${prescriptionId}/review`, {
      method: 'POST',
      body,
      token,
    }),

  users: (token: string, query: { role?: string; q?: string; cursor?: string } = {}) =>
    request<AdminUserPage>('/admin/users', { token, query, cache: 'no-store' }),

  updateUser: (
    token: string,
    userId: string,
    body: { role?: string; is_active?: boolean; reason?: string },
  ) => request<AdminUser>(`/admin/users/${userId}`, { method: 'PATCH', body, token }),

  audit: (token: string, query: { action?: string; cursor?: string } = {}) =>
    request<AuditPage>('/admin/audit', { token, query, cache: 'no-store' }),
};
