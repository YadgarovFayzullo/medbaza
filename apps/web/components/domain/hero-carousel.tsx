'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export interface Slide {
  id: string;
  /** A file in `public/`, e.g. `/download.png`. */
  src: string;
  /** The banner's copy is baked into the artwork, so the alt text has to carry it. */
  alt: string;
  href: string;
}

const INTERVAL = 7000;

/**
 * Promo carousel.
 *
 * The banners are finished artwork with their own typography, so nothing is
 * drawn on top of them — the component only frames, links, and advances them.
 * A fixed aspect ratio keeps the slot from shifting while an image loads.
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => setIndex((current) => (current + 1) % slides.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Reklama bannerlari"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative overflow-hidden rounded-lg border border-accent/10 bg-white"
    >
      {/* Narrow screens crop the right-hand artwork rather than shrinking the
          headline that is part of the image. */}
      <div className="relative aspect-[16/7] w-full sm:aspect-[3/1]">
        {slides.map((slide, position) => (
          <Link
            key={slide.id}
            href={slide.href}
            aria-hidden={position !== index}
            tabIndex={position === index ? 0 : -1}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              position === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={position === 0}
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-left"
            />
          </Link>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <CarouselButton side="left" onClick={() => go(index - 1)} />
          <CarouselButton side="right" onClick={() => go(index + 1)} />

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/85 px-2 py-1.5">
            {slides.map((slide, position) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${position + 1}-bannerni ko’rsatish`}
                aria-current={position === index}
                onClick={() => go(position)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  position === index ? 'w-6 bg-primary-ink' : 'w-1.5 bg-accent/25',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function CarouselButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Oldingi banner' : 'Keyingi banner'}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-accent/15 bg-white/90 text-accent/70 hover:border-accent/35 hover:text-accent sm:flex',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
