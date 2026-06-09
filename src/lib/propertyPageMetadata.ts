const SITE_URL = 'https://estoria.estate';

export interface PropertyMetadataImage {
  url?: string;
  mediumUrl?: string;
  largeUrl?: string;
  isCover?: boolean;
}

export interface PropertyMetadata {
  slug: string;
  title: string;
  address: string;
  price: number;
  currency?: string;
  transactionType: string;
  coverImageUrl?: string;
  images?: PropertyMetadataImage[];
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceMeta = (
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']${escapeRegExp(key)}["'][^>]*>`,
    'i',
  );

  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
};

export function getPropertySocialImage(property: PropertyMetadata) {
  const cover = property.images?.find((image) => image.isCover);
  return (
    cover?.largeUrl ??
    cover?.mediumUrl ??
    cover?.url ??
    property.coverImageUrl ??
    `${SITE_URL}/og-image.jpg`
  );
}

export function injectPropertyMetadata(
  template: string,
  property: PropertyMetadata,
) {
  const title = `${property.title} - Estoria`;
  const canonicalUrl = `${SITE_URL}/properties/${encodeURIComponent(property.slug)}`;
  const image = getPropertySocialImage(property);
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: property.currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(property.price);
  const description = `${property.title} - ${property.address} - ${formattedPrice}`;

  let html = template.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:type', 'article');
  html = replaceMeta(html, 'property', 'og:url', canonicalUrl);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:image', image);
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', image);

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `    ${canonicalTag}\n  </head>`);
  }

  return html;
}
