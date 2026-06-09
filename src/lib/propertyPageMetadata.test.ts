import { describe, expect, it } from 'vitest';
import { injectPropertyMetadata } from '@/lib/propertyPageMetadata';

const template = `<!doctype html>
<html>
  <head>
    <title>Estoria</title>
    <meta name="description" content="General description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://estoria.estate/" />
    <meta property="og:title" content="General title" />
    <meta property="og:description" content="General description" />
    <meta property="og:image" content="https://estoria.estate/og-image.jpg" />
    <meta name="twitter:title" content="General title" />
    <meta name="twitter:description" content="General description" />
    <meta name="twitter:image" content="https://estoria.estate/og-image.jpg" />
  </head>
</html>`;

describe('injectPropertyMetadata', () => {
  it('uses the marked cover image large variant for social cards', () => {
    const html = injectPropertyMetadata(template, {
      slug: 'city-home',
      title: 'City Home',
      address: 'Madara 1',
      price: 352000,
      currency: 'EUR',
      transactionType: 'Sale',
      coverImageUrl: 'https://cdn.example/cover-medium.webp',
      images: [
        {
          url: 'https://cdn.example/cover-medium.webp',
          largeUrl: 'https://cdn.example/cover-large.webp',
          isCover: true,
        },
      ],
    });

    expect(html).toContain(
      '<meta property="og:image" content="https://cdn.example/cover-large.webp" />',
    );
    expect(html).toContain(
      '<meta name="twitter:image" content="https://cdn.example/cover-large.webp" />',
    );
    expect(html).toContain(
      '<meta property="og:url" content="https://estoria.estate/properties/city-home" />',
    );
  });

  it('escapes property text before placing it in the document head', () => {
    const html = injectPropertyMetadata(template, {
      slug: 'quoted-home',
      title: 'Home "A" <script>',
      address: 'Pärnu mnt 1',
      price: 1000,
      currency: 'EUR',
      transactionType: 'Rent',
      coverImageUrl: 'https://cdn.example/cover.webp',
      images: [],
    });

    expect(html).toContain('<title>Home &quot;A&quot; &lt;script&gt; - Estoria</title>');
    expect(html).not.toContain('<title>Home "A" <script>');
  });
});
