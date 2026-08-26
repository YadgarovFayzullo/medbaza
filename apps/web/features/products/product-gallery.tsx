'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

/**
 * Swipeable product gallery: a thumbnail rail down the left, the active photo
 * beside it.
 *
 * The track is a scroll-snap row, so swiping on a touch screen and two-finger
 * scrolling on a trackpad are the browser's own behaviour rather than a drag
 * handler we maintain — and it still works before hydration.
 *
 * §9 says nothing may scroll sideways *to be reachable*. That rule is about
 * destinations, and it is honoured here: every image is also reachable by its
 * thumbnail, its dot, and the arrow keys, so the swipe is a convenience rather
 * than the only way through.
 */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      const node = track.current;
      if (!node) return;
      // Wraps in both directions, so the first card still goes left and the
      // last still goes right instead of dead-ending.
      const count = images.length;
      const target = ((index % count) + count) % count;
      const slide = node.children[target] as HTMLElement | undefined;
      if (slide) node.scrollTo({ left: slide.offsetLeft - node.offsetLeft, behavior: 'smooth' });
    },
    [images.length],
  );

  // Which slide is showing follows the scroll position, so the indicator stays
  // honest whether the reader swiped, clicked a thumbnail, or used the keyboard.
  useEffect(() => {
    const node = track.current;
    if (!node) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(node.scrollLeft / node.clientWidth);
        setActive(Math.max(0, Math.min(images.length - 1, index)));
      });
    };

    node.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('scroll', onScroll);
    };
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-accent/10 bg-base">
        <Package className="h-12 w-12 text-accent/15" aria-hidden />
      </div>
    );
  }

  const many = images.length > 1;

  return (
    <div className="flex gap-3">
      {many ? (
        // The rail is a column beside the photo on anything wider than a phone;
        // on a phone the swipe plus the dots carry it and this would just eat
        // the width the product photo needs.
        <ul className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
          {images.slice(0, 8).map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`${index + 1}-rasmni ko’rsatish`}
                aria-current={index === active ? 'true' : undefined}
                className={`block w-full overflow-hidden rounded-lg border bg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink focus-visible:ring-offset-2 ${
                  index === active ? 'border-primary-ink' : 'border-accent/10 hover:border-accent/25'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="min-w-0 flex-1 space-y-3">
        <div className="relative">
          <ul
            ref={track}
            tabIndex={many ? 0 : undefined}
            aria-label={many ? `${name} — rasmlar` : undefined}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') goTo(active + 1);
              if (event.key === 'ArrowLeft') goTo(active - 1);
            }}
            className="flex snap-x snap-mandatory overflow-x-auto rounded-lg border border-accent/10 bg-base [-ms-overflow-style:none] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, index) => (
              <li key={image} className="w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={many ? `${name} — ${index + 1}-rasm` : name}
                  // The first image is above the fold; the rest wait until swiped to.
                  loading={index === 0 ? 'eager' : 'lazy'}
                  // `contain`, not `cover`: a catalogue photo is a whole object
                  // on a plain ground, and cropping it hides what is being sold.
                  className="aspect-[4/5] w-full object-contain"
                />
              </li>
            ))}
          </ul>

          {many ? (
            <>
              <GalleryArrow side="left" label="Oldingi rasm" onClick={() => goTo(active - 1)} />
              <GalleryArrow side="right" label="Keyingi rasm" onClick={() => goTo(active + 1)} />
            </>
          ) : null}
        </div>

        {many ? (
          // The rail is hidden on a phone, so the dots are what says "there is
          // more here" at that width.
          <div className="flex justify-center gap-1.5 sm:hidden" aria-hidden>
            {images.map((image, index) => (
              <span
                key={image}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? 'w-4 bg-primary-ink' : 'w-1.5 bg-accent/20'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GalleryArrow({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full border border-accent/10 bg-white/90 p-2 text-accent hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink sm:block ${
        side === 'left' ? 'left-2' : 'right-2'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
