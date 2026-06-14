import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Share2, X, ChevronLeft, ChevronRight,
  Maximize2, DoorOpen, BedDouble, Bath, Building, Layers, Calendar, Zap,
  Check, Loader2, FileText,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from '@/components/PropertyCard';
import PropertyHistory from '@/components/PropertyHistory';
import ContactActions from '@/components/ContactActions';
import { useProperty, useProperties } from '@/hooks/api/useProperties';
import { propertyTypeLabel } from '@/lib/enumLabels';
import api from '@/lib/api';
import Seo from '@/components/Seo';
import { SafeHtml } from '@/components/SafeHtml';
import MobilePropertyGallery, { type GalleryImage } from '@/components/MobilePropertyGallery';
import { getPropertySocialImage } from '@/lib/propertyPageMetadata';

const PropertyMap = lazy(() => import('@/components/PropertyMap'));

/** Strip HTML tags + collapse whitespace for plain-text use (JSON-LD descriptions). */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const eur = (value: number) =>
  new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));

/**
 * Self-contained mortgage estimator. Standard amortised payment:
 * M = P·r / (1 − (1 + r)^−n), where P = loan, r = monthly rate, n = months.
 */
function MortgageCalculator({ price }: { price: number }) {
  const { t } = useTranslation();
  const [downPct, setDownPct] = useState(20);
  const [interest, setInterest] = useState(4.5);
  const [years, setYears] = useState(30);

  const { loan, monthly } = useMemo(() => {
    const safePct = Math.min(Math.max(downPct, 0), 100);
    const loanAmount = price * (1 - safePct / 100);
    const n = Math.max(years, 1) * 12;
    const r = interest / 100 / 12;
    const payment =
      r === 0 ? loanAmount / n : (loanAmount * r) / (1 - Math.pow(1 + r, -n));
    return { loan: loanAmount, monthly: Number.isFinite(payment) ? payment : 0 };
  }, [price, downPct, interest, years]);

  const fieldCls =
    'w-full bg-secondary border border-border text-foreground text-sm font-body px-3 py-2 rounded-sm outline-none focus:border-primary transition-colors';

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="h-1 gold-gradient" />
      <div className="p-6">
        <h3 className="font-heading text-xl text-foreground mb-5">
          {t('mortgage.title', 'Mortgage calculator')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-muted-foreground text-xs font-body mb-1 block">
              {t('mortgage.downPayment', 'Down payment')} (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className="text-muted-foreground text-xs font-body mb-1 block">
              {t('mortgage.interest', 'Interest rate')} (%)
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={interest}
              onChange={(e) => setInterest(Number(e.target.value))}
              className={fieldCls}
            />
          </label>
          <label className="block col-span-2">
            <span className="text-muted-foreground text-xs font-body mb-1 block">
              {t('mortgage.years', 'Years')}
            </span>
            <input
              type="number"
              min={1}
              max={40}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className={fieldCls}
            />
          </label>
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex items-end justify-between">
            <span className="text-muted-foreground text-xs font-body">
              {t('mortgage.monthly', 'Monthly payment')}
            </span>
            <span className="font-heading text-3xl text-primary font-medium">
              {eur(monthly)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs font-body mt-1">
            {t('mortgage.loanAmount', 'Loan amount')}: {eur(loan)}
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground font-body mt-4">
          {t('mortgage.disclaimer', 'Estimate only — not a loan offer.')}
        </p>
      </div>
    </div>
  );
}

export default function PropertyDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const { data: property, isLoading, error } = useProperty(slug);

  // Similar properties (same type or city, page 1)
  const { data: similarData } = useProperties(
    property ? { type: property.propertyType, city: property.city } : undefined
  );
  const similarProperties = useMemo(() => {
    if (!property || !similarData?.data) return [];
    return similarData.data.filter(p => p.id !== property.id).slice(0, 3);
  }, [property, similarData]);

  /**
   * Each entry exposes all available variant URLs so the hero can srcset
   * across thumb/medium/large while the lightbox + grid keep their existing
   * string-based access via .display.
   */
  const images = useMemo(() => {
    if (!property) return [] as GalleryImage[];
    if (property.images && property.images.length > 0) {
      return property.images.map(i => {
        const display = i.largeUrl ?? i.mediumUrl ?? i.url ?? i.thumbUrl ?? '';
        return {
          thumb:   i.thumbUrl  ?? i.url,
          medium:  i.mediumUrl ?? i.url,
          large:   i.largeUrl  ?? i.mediumUrl ?? i.url,
          display,
        };
      });
    }
    if (property.coverImageUrl) {
      return [{ thumb: property.coverImageUrl, medium: property.coverImageUrl, large: property.coverImageUrl, display: property.coverImageUrl }];
    }
    return [];
  }, [property]);

  // Per-route SEO + JSON-LD handled via <Seo /> below.

  // Keyboard support for the lightbox: Escape closes, arrows navigate. Defined
  // before the early returns so the hook order stays stable across renders.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % images.length);
      else if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, images.length]);


  if (isLoading) {
    return (
      <div className="pt-20">
        {/* Image strip */}
        <Skeleton className="w-full h-[60vh]" />
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: details */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <div className="grid grid-cols-3 gap-4 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-secondary rounded-sm p-4">
                    <Skeleton className="h-4 w-8 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>
            </div>
            {/* Right: contact panel */}
            <div>
              <div className="border border-border rounded-sm p-6 space-y-4">
                <Skeleton className="h-7 w-1/2 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-11 w-full rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-4 break-words">{t('common.notFound')}</h1>
          <Link
            to="/properties"
            className="text-primary font-nav text-xs uppercase tracking-wider hover:underline"
          >
            {t('properties.detail.backToProperties')}
          </Link>
        </div>
      </div>
    );
  }

  function formatPrice(price: number, type: string) {
    const formatted = new Intl.NumberFormat('et-EE').format(price);
    return type === 'rent' ? `€${formatted}${t('properties.perMonth')}` : `€${formatted}`;
  }

  const specs = [
    { icon: Maximize2, label: t('properties.detail.specs.size'),        value: property.size ? `${property.size} m²` : null },
    { icon: DoorOpen,  label: t('properties.detail.specs.rooms'),       value: property.rooms || null },
    { icon: BedDouble, label: t('properties.detail.specs.bedrooms'),    value: property.bedrooms || null },
    { icon: Bath,      label: t('properties.detail.specs.bathrooms'),   value: property.bathrooms || null },
    {
      icon: Building,
      label: t('properties.detail.specs.floor'),
      value: property.floor ? `${property.floor}/${property.totalFloors}` : null,
    },
    {
      icon: Layers,
      label: t('properties.detail.specs.totalFloors'),
      value: !property.floor ? property.totalFloors : null,
    },
    { icon: Calendar, label: t('properties.detail.specs.yearBuilt'),   value: property.yearBuilt || null },
    { icon: Zap,      label: t('properties.detail.specs.energyClass'), value: property.energyClass || null },
  ].filter((s) => s.value !== null && s.value !== 0);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };
  const nextImage = () => setLightboxIndex((i) => (i + 1) % images.length);
  const prevImage = () => setLightboxIndex((i) => (i - 1 + images.length) % images.length);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share cancelled by the user or clipboard blocked (non-secure context) — no-op.
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(false);
    try {
      await api.post('/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: t('contact.inquiry.subject', { title: property.title }),
        message: formData.message,
        propertyId: property.id,
      });
      setFormSent(true);
    } catch {
      setFormError(true);
    } finally {
      setFormLoading(false);
    }
  };

  // schema.org rich-results object. Sub-fields are only included when the
  // backing data exists so we never fabricate values for crawlers.
  const ldAddress: Record<string, unknown> = { '@type': 'PostalAddress', addressCountry: 'EE' };
  if (property.address) ldAddress.streetAddress = property.address;
  if (property.city) ldAddress.addressLocality = property.city;
  if (property.district) ldAddress.addressRegion = property.district;

  const propertyLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': property.propertyType === 'apartment' ? 'Apartment' : 'Residence',
    name: property.title,
    url: `https://estoria.estate/properties/${property.slug}`,
    image: [getPropertySocialImage(property)],
    address: ldAddress,
  };
  if (property.description) propertyLd.description = stripHtml(property.description);
  if (property.size) {
    propertyLd.floorSize = { '@type': 'QuantitativeValue', value: property.size, unitCode: 'MTK' };
  }
  if (property.rooms) propertyLd.numberOfRooms = property.rooms;
  if (property.price) {
    propertyLd.offers = {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency || 'EUR',
      availability: 'https://schema.org/InStock',
    };
  }

  // Prefilled inquiry message reused for the agent quick-action channels.
  const inquiryMessage = t('contact.inquiry.message', {
    title: property.title,
    address: property.address,
  });

  const seoDescription = `${property.title} · ${property.address} · ${formatPrice(property.price, property.transactionType)}`;

  return (
    <>
      <Seo
        title={`${property.title} — Estoria`}
        description={seoDescription}
        path={`/properties/${property.slug}`}
        image={getPropertySocialImage(property)}
        type="article"
        jsonLd={propertyLd}
      />
      {/* Breadcrumb */}
      <div className="pt-24 pb-4 container mx-auto px-4 sm:px-6">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-primary transition-colors">
            {t('nav.properties')}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{property.title}</span>
        </nav>
      </div>

      {/* Gallery */}
      <section className="container mx-auto px-4 sm:px-6 mb-10">
        <MobilePropertyGallery
          images={images}
          title={property.title}
          onOpen={openLightbox}
          galleryLabel={t('properties.detail.galleryDialog', 'Photo gallery')}
          openGalleryLabel={t('properties.detail.openGallery', 'Open photo gallery')}
          getPhotoLabel={(index) =>
            t('properties.detail.viewPhoto', 'View photo {{number}}', { number: index + 1 })
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:grid md:grid-cols-4 gap-2 rounded-sm overflow-hidden"
        >
          {/* Main image */}
          <button
            type="button"
            className="md:col-span-3 aspect-[16/9] md:aspect-auto md:row-span-2 relative cursor-pointer group bg-muted text-left"
            onClick={() => openLightbox(0)}
            aria-label={t('properties.detail.openGallery', 'Open photo gallery')}
          >
            {images[0] && (
              <picture>
                {images[0].large && (
                  <source srcSet={images[0].large} media="(min-width: 1280px)" type="image/webp" />
                )}
                {images[0].medium && (
                  <source srcSet={images[0].medium} media="(min-width: 640px)" type="image/webp" />
                )}
                <img
                  src={images[0].medium ?? images[0].thumb ?? images[0].display}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          </button>

          {/* Thumbnails */}
          {images.slice(1, 3).map((img, i) => (
            <button
              type="button"
              key={i}
              className="hidden md:block aspect-[4/3] relative cursor-pointer group bg-muted"
              onClick={() => openLightbox(i + 1)}
              aria-label={
                i === 1 && images.length > 3
                  ? t('properties.detail.viewAllPhotos', { count: images.length })
                  : t('properties.detail.viewPhoto', 'View photo {{number}}', { number: i + 2 })
              }
            >
              <img
                src={img.thumb ?? img.medium ?? img.display}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              {i === 1 && images.length > 3 && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <span className="font-nav text-xs uppercase tracking-wider text-foreground">
                    {t('properties.detail.viewAllPhotos', { count: images.length })}
                  </span>
                </div>
              )}
            </button>
          ))}
        </motion.div>

      </section>

      {/* Content */}
      <section className="container mx-auto px-4 sm:px-6 pb-28 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left column */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Price */}
              <p className="font-heading text-4xl md:text-5xl text-primary font-medium mb-4">
                {formatPrice(property.price, property.transactionType)}
              </p>

              {/* Title */}
              <h1 className="font-heading text-3xl md:text-4xl text-foreground font-light mb-3">
                {property.title}
              </h1>

              {/* Address + badges */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                  <MapPin size={14} className="text-primary" />
                  {property.address}
                </span>
                <span className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-foreground px-3 py-1 rounded-sm">
                  {property.transactionType === 'sale'
                    ? t('properties.forSale')
                    : t('properties.forRent')}
                </span>
                <span className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1 rounded-sm">
                  {propertyTypeLabel(property.propertyType, t)}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px gold-gradient mb-8" />

              {/* Description */}
              {property.description && (
                <SafeHtml className="prose-estoria mb-12" html={property.description} />
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-heading text-2xl text-foreground mb-6">
                    {t('properties.detail.featuresTitle')}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 bg-secondary border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground"
                      >
                        <Check size={14} className="text-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price / status history */}
              <PropertyHistory slug={property.slug} />

              {/* Location map — Leaflet + OpenStreetMap, lazy-loaded so the
                  mapping libs stay out of the main bundle. */}
              {property.lat && property.lng && (
                <div className="mb-12">
                  <h2 className="font-heading text-2xl text-foreground mb-6">{t('properties.detail.locationTitle')}</h2>
                  {property.address && (
                    <p className="font-body text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      {property.address}
                    </p>
                  )}
                  <div className="aspect-[16/9] rounded-sm border border-border overflow-hidden">
                    <Suspense fallback={<div className="w-full h-full bg-secondary animate-pulse" />}>
                      <PropertyMap lat={property.lat} lng={property.lng} address={property.address} />
                    </Suspense>
                  </div>
                </div>
              )}

              {/* Similar properties */}
              {similarProperties.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl text-foreground mb-6">{t('properties.detail.similarTitle')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {similarProperties.map((p, i) => (
                      <PropertyCard key={p.id} property={p} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column — sticky */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28 space-y-6">
              {/* Specs card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-sm overflow-hidden"
              >
                <div className="h-1 gold-gradient" />
                <div className="p-6">
                  <h3 className="font-heading text-xl text-foreground mb-5">{t('properties.detail.specsTitle')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {specs.map(({ icon: Icon, label, value }) => (
                      <div key={label}>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-body mb-1">
                          <Icon size={12} />
                          {label}
                        </div>
                        <p className="text-foreground font-semibold font-body text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Mortgage estimator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <MortgageCalculator price={property.price} />
              </motion.div>

              {/* Agent card */}
              {property.agent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-sm p-6"
                >
                  <div className="flex items-center gap-4 mb-5">
                    {property.agent.photoUrl && (
                      <img
                        src={property.agent.photoUrl}
                        alt={property.agent.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-heading text-lg text-foreground">
                        {property.agent.name}
                      </h4>
                      <p className="text-xs text-primary font-nav uppercase tracking-wider">
                        {property.agent.role}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                    >
                      <Phone size={14} /> {property.agent.phone}
                    </a>
                    <a
                      href={`mailto:${property.agent.email}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                    >
                      <Mail size={14} /> {property.agent.email}
                    </a>
                  </div>

                  {/* Quick-action contact channels (call / WhatsApp / email) */}
                  <ContactActions
                    phone={property.agent.phone}
                    email={property.agent.email}
                    message={inquiryMessage}
                    variant="solid"
                    className="mb-5"
                  />

                  {property.agent.languages && property.agent.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {property.agent.languages.map((lang) => (
                        <span
                          key={lang}
                          className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-2.5 py-1 rounded-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href="#contact-form"
                    className="block w-full text-center gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    {t('properties.detail.contactAgent')}
                  </a>
                </motion.div>
              )}

              {/* Contact form */}
              <motion.div
                id="contact-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-sm p-6"
              >
                <h3 className="font-heading text-xl text-foreground mb-5">{t('properties.detail.sendMessage')}</h3>

                {formSent ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="text-success" size={20} />
                    </div>
                    <p className="text-foreground font-body text-sm">{t('properties.detail.messageSent')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="space-y-3">
                    <input
                      type="text"
                      placeholder={t('properties.detail.namePlaceholder')}
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <input
                      type="email"
                      placeholder={t('properties.detail.emailPlaceholder')}
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <input
                      type="tel"
                      placeholder={t('properties.detail.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <textarea
                      placeholder={t('properties.detail.messagePlaceholder', { title: property.title })}
                      rows={3}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                    />
                    {formError && (
                      <p className="text-destructive text-xs font-body">
                        {t('properties.detail.submitError')}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 size={14} className="animate-spin" />}
                      {t('properties.detail.submitButton')}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 border border-border text-muted-foreground hover:text-primary hover:border-primary py-3 rounded-sm font-nav text-xs uppercase tracking-wider transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} /> {t('properties.detail.shareCopied')}
                  </>
                ) : (
                  <>
                    <Share2 size={14} /> {t('properties.detail.shareProperty')}
                  </>
                )}
              </button>

              {/* Brochure / print view (opened in a new tab) */}
              <a
                href={`/properties/${property.slug}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border border-border text-muted-foreground hover:text-primary hover:border-primary py-3 rounded-sm font-nav text-xs uppercase tracking-wider transition-colors"
              >
                <FileText size={14} /> {t('property.brochure', 'Download brochure')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-between lg:hidden z-40">
        <p className="font-heading text-2xl text-primary font-medium">
          {formatPrice(property.price, property.transactionType)}
        </p>
        <a
          href="#contact-form"
          className="gold-gradient text-primary-foreground px-6 py-2.5 rounded-sm font-nav text-xs uppercase tracking-wider"
        >
          {t('properties.detail.mobileContact')}
        </a>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t('properties.detail.galleryDialog', 'Photo gallery')}
          >
            <button
              className="absolute top-6 right-6 text-foreground hover:text-primary z-10"
              onClick={() => setLightboxOpen(false)}
              aria-label={t('common.close', 'Close')}
            >
              <X size={28} />
            </button>

            <span className="absolute top-6 left-6 font-nav text-xs uppercase tracking-wider text-muted-foreground">
              {lightboxIndex + 1} / {images.length}
            </span>

            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-foreground hover:text-primary z-10"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label={t('properties.detail.previousPhoto', 'Previous photo')}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-foreground hover:text-primary z-10"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label={t('properties.detail.nextPhoto', 'Next photo')}
            >
              <ChevronRight size={32} />
            </button>

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={images[lightboxIndex]?.large ?? images[lightboxIndex]?.medium ?? images[lightboxIndex]?.display}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
