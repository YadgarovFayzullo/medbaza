'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

import { Alert, Button, Card } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Product } from '@/lib/api-client/endpoints';

// Mirrors MAX_PRODUCT_IMAGES and the accepted types on the API, which is the
// enforcement point — this is only here to fail fast and say why.
const MAX_IMAGES = 8;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export function ListingImages({ productId, images }: { productId: string; images: string[] }) {
  const router = useRouter();
  const { getToken } = useSession();
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const full = images.length >= MAX_IMAGES;

  async function run(label: string, action: (token: string | null) => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await action(await getToken());
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Amalni bajarib bo’lmadi.');
    } finally {
      setBusy(null);
    }
  }

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError('Faqat JPEG, PNG yoki WebP rasm yuklash mumkin.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Rasm hajmi 5 MB dan oshmasligi kerak.');
      return;
    }
    await run('upload', (token) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<Product>(`/seller/products/${productId}/images`, {
        method: 'POST',
        formData,
        token,
      });
    });
    // Let the same file be picked again after a failure.
    if (picker.current) picker.current.value = '';
  }

  /** Order is the carousel's order, so promoting is a reorder, not a flag. */
  async function makeFirst(key: string) {
    await run(key, (token) =>
      request<Product>(`/seller/products/${productId}`, {
        method: 'PATCH',
        body: { images: [key, ...images.filter((image) => image !== key)] },
        token,
      }),
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Rasmlar</h2>
          <p className="mt-1 text-xs text-accent/60">
            Birinchi rasm do’konda ko’rinadi. Eng ko’pi {MAX_IMAGES} ta, har biri 5 MB gacha.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={busy === 'upload'}
          disabled={full}
          onClick={() => picker.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Rasm qo’shish
        </Button>
      </div>

      <input
        ref={picker}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(event) => void upload(event.target.files)}
      />

      {error ? (
        <Alert tone="warning" title="Rasm saqlanmadi" className="mt-4">
          {error}
        </Alert>
      ) : null}

      {full ? (
        <p className="mt-4 text-xs text-accent/60">
          Rasmlar soni to’ldi — yangisini qo’shish uchun bittasini o’chiring.
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-accent/15 px-4 py-8 text-center text-sm text-accent/60">
          Hali rasm yo’q. Rasmsiz e’lon xaridorlar ro’yxatida bo’sh ko’rinadi.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image} className="overflow-hidden rounded-lg border border-accent/10">
              {/* Plain <img>: the dev media route is http, which the Next image
                  optimizer's remotePatterns deliberately does not allow. */}
              <img
                src={image}
                alt={`Rasm ${index + 1}`}
                className="aspect-square w-full bg-base object-cover"
              />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="text-xs text-accent/60">
                  {index === 0 ? 'Asosiy' : `#${index + 1}`}
                </span>
                <div className="flex items-center gap-0.5">
                  {index > 0 ? (
                    <button
                      type="button"
                      title="Asosiy rasm qilish"
                      aria-label={`${index + 1}-rasmni asosiy qilish`}
                      disabled={busy !== null}
                      onClick={() => void makeFirst(image)}
                      className="rounded-lg p-1.5 text-accent/60 hover:bg-base hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="O’chirish"
                    aria-label={`${index + 1}-rasmni o’chirish`}
                    disabled={busy !== null}
                    onClick={() =>
                      void run(image, (token) =>
                        request<Product>(`/seller/products/${productId}/images`, {
                          method: 'DELETE',
                          query: { key: image },
                          token,
                        }),
                      )
                    }
                    className="rounded-lg p-1.5 text-accent/60 hover:bg-base hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
