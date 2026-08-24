import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/api-client/endpoints';

/**
 * Bust a storefront cache tag.
 *
 * Category and product pages are cached with ISR (CLAUDE.md §3.8), so a catalog
 * change is otherwise invisible until the window closes. Call this after a
 * seed, an import, or a listing going live:
 *
 *   curl -X POST localhost:3000/api/revalidate \
 *        -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *        -H 'content-type: application/json' -d '{"tag":"catalog"}'
 */
const ALLOWED = new Set<string>([CACHE_TAGS.catalog, CACHE_TAGS.categories, CACHE_TAGS.products]);

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: 'REVALIDATE_NOT_CONFIGURED', message: 'REVALIDATE_SECRET is not set.' } },
      { status: 503 },
    );
  }
  if (request.headers.get('x-revalidate-secret') !== secret) {
    // Same shape as any other rejection; no hint about why it failed.
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not allowed.' } },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { tag?: string };
  const tag = body.tag ?? CACHE_TAGS.catalog;

  // A per-product tag is legitimate but unbounded, so it is matched by shape
  // rather than being listed.
  if (!ALLOWED.has(tag) && !/^product:[a-z0-9-]+$/.test(tag)) {
    return NextResponse.json(
      { error: { code: 'UNKNOWN_TAG', message: `Unknown cache tag: ${tag}` } },
      { status: 422 },
    );
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: tag });
}
