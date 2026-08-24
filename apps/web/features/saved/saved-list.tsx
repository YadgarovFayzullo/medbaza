'use client';

import { useQueries } from '@tanstack/react-query';
import { Heart } from 'lucide-react';

import { ProductCard } from '@/components/domain/product-card';
import { Button, ButtonLink, EmptyState, Skeleton } from '@/components/ui';
import { useSaved } from '@/features/saved/saved-provider';
import { ApiError } from '@/lib/api-client';
import { catalog, type Product } from '@/lib/api-client/endpoints';

export function SavedList() {
  const { slugs, ready, clear, remove } = useSaved();

  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['product', slug],
      queryFn: () => catalog.product(slug),
      staleTime: 60_000,
      retry: false,
    })),
  });

  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-72" />
        ))}
      </div>
    );
  }

  if (slugs.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Saralanganlar ro’yxati bo’sh"
        description="Yoqqan mahsulotni yurakcha tugmasi bilan saqlab qo’ying — keyin shu yerdan topasiz."
        action={<ButtonLink href="/search">Katalogni ko’rish</ButtonLink>}
      />
    );
  }

  const products = results
    .map((result, index) => ({ result, slug: slugs[index]! }))
    .filter((entry) => entry.result.data)
    .map((entry) => entry.result.data as Product);

  // Arxivlangan yoki o’chirilgan e’lonlar ro’yxatda osilib qolmasligi kerak.
  const missing = results
    .map((result, index) => ({ result, slug: slugs[index]! }))
    .filter((entry) => entry.result.error instanceof ApiError && entry.result.error.status === 404);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-accent/60">{slugs.length} ta mahsulot</p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Ro’yxatni tozalash
        </Button>
      </div>

      {results.some((result) => result.isLoading) ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: slugs.length }).map((_, index) => (
            <Skeleton key={index} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {missing.length > 0 ? (
        <div className="rounded-lg border border-accent/10 bg-white p-5 text-sm text-accent/60">
          <p>{missing.length} ta mahsulot endi mavjud emas.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => missing.forEach((entry) => remove(entry.slug))}
          >
            Ro’yxatdan olib tashlash
          </Button>
        </div>
      ) : null}
    </div>
  );
}
