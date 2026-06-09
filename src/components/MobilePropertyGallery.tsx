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
        <div className="mt-4 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => api?.scrollTo(index)}
              aria-label={getPhotoLabel(index)}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className={`h-2 w-2 rounded-full transition-colors ${
                selectedIndex === index
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40 hover:bg-primary'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
