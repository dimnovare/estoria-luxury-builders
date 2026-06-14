import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer, Loader2 } from 'lucide-react';
import { useProperty } from '@/hooks/api/useProperties';
import { SafeHtml } from '@/components/SafeHtml';

/**
 * Print-optimised, single-sheet property brochure.
 *
 * This page deliberately renders on a plain white background outside the dark
 * site chrome (no Navbar/Footer) because its only purpose is "Save as PDF" via
 * the browser print dialog. The route is public: /properties/:slug/print.
 */
export default function PropertyBrochure() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: property, isLoading, error } = useProperty(slug);

  // Mirror the detail page: prefer processed variant URLs, fall back to cover.
  const images = useMemo(() => {
    if (!property) return [] as string[];
    if (property.images && property.images.length > 0) {
      return property.images
        .map((i) => i.largeUrl ?? i.mediumUrl ?? i.url ?? i.thumbUrl ?? '')
        .filter(Boolean);
    }
    if (property.coverImageUrl) return [property.coverImageUrl];
    return [];
  }, [property]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2
          className="animate-spin text-gray-400"
          size={28}
          role="status"
          aria-label={t('common.loading', 'Loading')}
        />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-700 text-lg">{t('common.notFound', 'Not found')}</p>
      </div>
    );
  }

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('et-EE').format(price);
    return type === 'rent'
      ? `€${formatted}${t('properties.perMonth', '/mo')}`
      : `€${formatted}`;
  };

  // Reuse the detail page spec i18n keys; only render specs that are present.
  const specs = [
    { label: t('properties.detail.specs.size'), value: property.size ? `${property.size} m²` : null },
    { label: t('properties.detail.specs.rooms'), value: property.rooms || null },
    { label: t('properties.detail.specs.bedrooms'), value: property.bedrooms || null },
    { label: t('properties.detail.specs.bathrooms'), value: property.bathrooms || null },
    {
      label: t('properties.detail.specs.floor'),
      value: property.floor ? `${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ''}` : null,
    },
    { label: t('properties.detail.specs.yearBuilt'), value: property.yearBuilt || null },
    { label: t('properties.detail.specs.energyClass'), value: property.energyClass || null },
  ].filter((s) => s.value !== null && s.value !== 0);

  const coverImage = images[0];
  const thumbnails = images.slice(1, 6);
  const listingUrl = `https://estoria.estate/properties/${property.slug}`;
  const location = [property.address, property.district, property.city].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Printer size={16} />
          {t('brochure.print', 'Print / Save as PDF')}
        </button>
      </div>

      {/* A4 sheet */}
      <div className="mx-auto max-w-[800px] px-5 sm:px-10 py-8 print:max-w-none print:px-0 print:py-0">
        {/* Header / wordmark */}
        <header className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <span className="text-2xl tracking-[0.3em] font-semibold">ESTORIA</span>
          <span className="text-xs uppercase tracking-wider text-gray-500">
            {property.transactionType === 'sale'
              ? t('properties.forSale', 'For sale')
              : t('properties.forRent', 'For rent')}
          </span>
        </header>

        {/* Title + price */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-light leading-tight mb-2 break-words">{property.title}</h1>
          {location && <p className="text-sm text-gray-600">{location}</p>}
          <p className="text-3xl font-medium mt-3">
            {formatPrice(property.price, property.transactionType)}
          </p>
        </div>

        {/* Cover image — keep together when printing */}
        {coverImage && (
          <div className="mb-4 break-inside-avoid print:break-inside-avoid">
            <img
              src={coverImage}
              alt={property.title}
              className="w-full h-[360px] object-cover rounded print:rounded-none"
            />
          </div>
        )}

        {/* Thumbnails */}
        {thumbnails.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-6 break-inside-avoid print:break-inside-avoid">
            {thumbnails.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-full h-20 object-cover rounded print:rounded-none"
              />
            ))}
          </div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-y-3 gap-x-6 border-y border-gray-200 py-4 mb-6">
            {specs.map((s) => (
              <div key={s.label}>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">{s.label}</p>
                <p className="text-base font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className="mb-8">
            <SafeHtml
              className="text-sm leading-relaxed text-gray-800 [&_p]:mb-3 [&_a]:underline"
              html={property.description}
            />
          </div>
        )}

        {/* Agent — keep together when printing */}
        {property.agent && (
          <div className="border border-gray-200 rounded p-5 mb-6 break-inside-avoid print:break-inside-avoid">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-3">
              {t('brochure.preparedBy', 'Prepared by')}
            </p>
            <div className="flex items-center gap-4">
              {property.agent.photoUrl && (
                <img
                  src={property.agent.photoUrl}
                  alt={property.agent.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-lg font-medium">{property.agent.name}</p>
                {property.agent.role && (
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                    {property.agent.role}
                  </p>
                )}
                {property.agent.phone && (
                  <p className="text-sm text-gray-700">{property.agent.phone}</p>
                )}
                {property.agent.email && (
                  <p className="text-sm text-gray-700">{property.agent.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer / public listing URL */}
        <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span>estoria.estate</span>
          <span className="break-all">{listingUrl}</span>
        </footer>
      </div>
    </div>
  );
}
