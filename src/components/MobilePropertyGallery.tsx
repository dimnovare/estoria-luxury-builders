import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

export interface GalleryImage {
  thumb?: string;
  medium?: string;
  large?: string;
  display: string;
}

interface MobilePropertyGalleryProps {
  images: GalleryImage[];
  title: string;
  onOpen: (index: number) => void;
  galleryLabel: string;
  openGalleryLabel: string;
  getPhotoLabel: (index: number) => string;
}

export default function MobilePropertyGallery({
  images,
  title,
  onOpen,
  galleryLabel,
  openGalleryLabel,
  getPhotoLabel,
}: MobilePropertyGalleryProps) {
  const [viewportRef, api] = useEmblaCarousel({ loop: images.length > 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncSelectedIndex = useCallback(() => {
    if (api) setSelectedIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    syncSelectedIndex();
    api.on('select', syncSelectedIndex);
    api.on('reInit', syncSelectedIndex);

    return () => {
      api.off('select', syncSelectedIndex);
      api.off('reInit', syncSelectedIndex);
    };
  }, [api, syncSelectedIndex]);

  if (images.length === 0) return null;

  return (
    <div className="md:hidden">
      <div
        ref={viewportRef}
        role="region"
        aria-label={galleryLabel}
        aria-roledescription="carousel"
        className="overflow-hidden rounded-sm bg-muted"
      >
        <div className="flex touch-pan-y">
          {images.map((image, index) => (
            <div
              key={`${image.display}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${images.length}`}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <button
                type="button"
                className="block aspect-[16/9] w-full text-left"
                onClick={() => onOpen(index)}
                aria-label={`${openGalleryLabel}: ${index + 1}`}
              >
                <picture>
                  {image.medium && <source srcSet={image.medium} type="image/webp" />}
                  <img
                    src={image.medium ?? image.thumb ?? image.display}
                    alt={index === 0 ? title : `${title} - ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                </picture>
              </button>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {/* Subtle single-row dots for a handful of photos; the active one is a
              short pill. For many photos, dots are impractical (and look like a
              grid), so we show a simple counter instead. Swipe is the primary nav. */}
          {images.length <= 8 ? (
            images.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => api?.scrollTo(index)}
                aria-label={getPhotoLabel(index)}
                aria-current={selectedIndex === index ? 'true' : undefined}
                className="py-2 -my-2 px-0.5"
              >
                <span
                  aria-hidden="true"
                  className={`block h-1.5 rounded-full transition-all ${
                    selectedIndex === index
                      ? 'w-5 bg-primary'
                      : 'w-1.5 bg-muted-foreground/40'
                  }`}
                />
              </button>
            ))
          ) : (
            <span className="font-nav text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
              {selectedIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
