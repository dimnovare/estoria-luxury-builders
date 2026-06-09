import { injectPropertyMetadata, type PropertyMetadata } from '../src/lib/propertyPageMetadata.js';

const API_URL = 'https://api.estoria.estate/api';

const detectLanguage = (request: Request) => {
  const accepted = request.headers.get('accept-language')?.toLowerCase() ?? '';
  if (accepted.startsWith('et')) return 'et';
  if (accepted.startsWith('ru')) return 'ru';
  return 'en';
};

export default {
  async fetch(request: Request) {
    const requestUrl = new URL(request.url);
    const slug = requestUrl.searchParams.get('slug');
    const templateHeaders = new Headers(request.headers);
    templateHeaders.delete('content-length');
    templateHeaders.set('accept', 'text/html');

    const templateResponse = await fetch(new URL('/index.html', requestUrl), {
      headers: templateHeaders,
    });
    const template = await templateResponse.text();

    if (!slug) {
      return new Response(template, {
        status: 400,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    try {
      const propertyResponse = await fetch(
        `${API_URL}/properties/${encodeURIComponent(slug)}?lang=${detectLanguage(request)}`,
        { headers: { accept: 'application/json' } },
      );

      if (!propertyResponse.ok) {
        return new Response(template, {
          status: propertyResponse.status === 404 ? 404 : 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }

      const property = (await propertyResponse.json()) as PropertyMetadata;
      const html = injectPropertyMetadata(template, property);

      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      });
    } catch {
      return new Response(template, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
  },
};
