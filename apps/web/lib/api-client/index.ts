/**
 * The typed API client.
 *
 * Types come from `schema.d.ts`, which is generated from the backend's OpenAPI
 * document by `npm run generate:api`. Nothing in the app hand-writes a type for an
 * API payload, and nothing outside this directory calls `fetch` against the API
 * (CLAUDE.md §2, §3.8).
 */
import type { components, paths } from './schema';

export type Schemas = components['schemas'];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const PREFIX = '/api/v1';

/** The fixed error envelope every failing endpoint returns (CLAUDE.md §3.4). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
    readonly requestId = '',
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level messages from a 422, keyed by field name. */
  get fieldErrors(): Record<string, string> {
    const fields = this.details.fields;
    return typeof fields === 'object' && fields !== null ? (fields as Record<string, string>) : {};
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, QueryValue>;
  /** Bearer token. Server Components pass one explicitly; the browser client
   * takes it from the in-memory session — never from `localStorage`. */
  token?: string | null;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${PREFIX}${path}`, API_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

/** Perform a request and return the parsed body plus response headers. */
export async function requestWithHeaders<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, formData, query, token, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    ...rest,
  });

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const envelope = (parsed as { error?: Record<string, unknown> } | null)?.error;
    throw new ApiError(
      response.status,
      String(envelope?.code ?? 'INTERNAL_ERROR'),
      String(envelope?.message ?? 'Nimadir noto’g’ri ketdi. Qayta urinib ko’ring.'),
      (envelope?.details as Record<string, unknown>) ?? {},
      String(envelope?.request_id ?? ''),
    );
  }

  return { data: parsed as T, headers: response.headers };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestWithHeaders<T>(path, options)).data;
}

// --- response type helpers, read straight off the generated schema ---------

type JsonOf<T> = T extends { content: { 'application/json': infer R } } ? R : never;

export type GetResponse<P extends keyof paths> = paths[P] extends {
  get: { responses: { 200: infer R } };
}
  ? JsonOf<R>
  : never;

export type PostResponse<P extends keyof paths> = paths[P] extends {
  post: { responses: infer R };
}
  ? R extends { 201: infer Created }
    ? JsonOf<Created>
    : R extends { 200: infer Ok }
      ? JsonOf<Ok>
      : never
  : never;

export type PatchResponse<P extends keyof paths> = paths[P] extends {
  patch: { responses: { 200: infer R } };
}
  ? JsonOf<R>
  : never;
