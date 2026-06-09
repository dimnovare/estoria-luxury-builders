import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobilePropertyGallery from '@/components/MobilePropertyGallery';

const scrollTo = vi.fn();

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [
    vi.fn(),
    {
      on: vi.fn(),
      off: vi.fn(),
      selectedScrollSnap: vi.fn(() => 0),
      scrollTo,
    },
  ]),
}));

describe('MobilePropertyGallery', () => {
  beforeEach(() => {
    scrollTo.mockClear();
  });

  it('renders every property image as a swipeable slide', () => {
    render(
      <MobilePropertyGallery
        title="City Home"
        images={[
          { display: '/one.webp' },
          { display: '/two.webp' },
          { display: '/three.webp' },
        ]}
        onOpen={vi.fn()}
        galleryLabel="Property photos"
        openGalleryLabel="Open photo gallery"
        getPhotoLabel={(index) => `View photo ${index + 1}`}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Property photos' }),
    ).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getAllByRole('group')).toHaveLength(3);
  });

  it('moves the carousel when a pagination dot is pressed', () => {
    render(
      <MobilePropertyGallery
        title="City Home"
        images={[{ display: '/one.webp' }, { display: '/two.webp' }]}
        onOpen={vi.fn()}
        galleryLabel="Property photos"
        openGalleryLabel="Open photo gallery"
        getPhotoLabel={(index) => `View photo ${index + 1}`}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View photo 2' }));

    expect(scrollTo).toHaveBeenCalledWith(1);
  });
});
