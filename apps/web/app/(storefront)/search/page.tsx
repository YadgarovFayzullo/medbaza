import { ProductBrowser, type BrowseParams } from '@/features/products/product-browser';

// Qidiruv natijalari keshlanmaydi: qoldiq va narx o‘qish paytida o‘zgaradi.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Qidiruv' };

export default function SearchPage({ searchParams }: { searchParams: BrowseParams }) {
  const term = searchParams.q?.trim();
  return (
    <ProductBrowser
      basePath="/search"
      params={searchParams}
      title={term ? `“${term}” bo’yicha natijalar` : 'Katalog'}
    />
  );
}
