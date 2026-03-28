import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Share2, X, ChevronLeft, ChevronRight,
  Maximize2, DoorOpen, BedDouble, Bath, Building, Layers, Calendar, Zap, Check, Copy, ExternalLink,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { allMockProperties } from '@/data/mockProperties';

export default function PropertyDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const property = allMockProperties.find(p => p.slug === slug);
  const images = property?.images || (property ? [property.imageUrl] : []);

  const similarProperties = useMemo(() => {
    if (!property) return [];
    return allMockProperties
      .filter(p => p.id !== property.id && (p.propertyType === property.propertyType || p.city === property.city))
      .slice(0, 3);
  }, [property]);

  // SEO
  useEffect(() => {
    if (property) {
      document.title = `${property.title} — ESTORIA`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', `${property.title} · ${property.address} · ${formatPrice(property.price, property.transactionType)}`);
    }
    return () => { document.title = 'ESTORIA — Where Your Future Lives'; };
  }, [property]);

  if (!property) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-5xl text-foreground mb-4">{t('common.notFound')}</h1>
          <Link to="/properties" className="text-primary font-nav text-xs uppercase tracking-wider hover:underline">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  function formatPrice(price: number, type: 'sale' | 'rent') {
    const formatted = new Intl.NumberFormat('et-EE').format(price);
    return type === 'rent' ? `€${formatted}/mo` : `€${formatted}`;
  }

  const specs = [
    { icon: Maximize2, label: 'Size', value: `${property.area} m²` },
    { icon: DoorOpen, label: 'Rooms', value: property.rooms || null },
    { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms || null },
    { icon: Bath, label: 'Bathrooms', value: property.bathrooms || null },
    { icon: Building, label: 'Floor', value: property.floor ? `${property.floor}/${property.totalFloors}` : null },
    { icon: Layers, label: 'Total Floors', value: !property.floor ? property.totalFloors : null },
    { icon: Calendar, label: 'Year Built', value: property.yearBuilt || null },
    { icon: Zap, label: 'Energy Class', value: property.energyClass || null },
  ].filter(s => s.value !== null && s.value !== 0);

  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); };
  const nextImage = () => setLightboxIndex(i => (i + 1) % images.length);
  const prevImage = () => setLightboxIndex(i => (i - 1 + images.length) % images.length);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: property.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4000);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-24 pb-4 container mx-auto px-6">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-primary transition-colors">{t('nav.properties')}</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{property.title}</span>
        </nav>
      </div>

      {/* Gallery */}
      <section className="container mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-sm overflow-hidden"
        >
          {/* Main image */}
          <div
            className="md:col-span-3 aspect-[16/9] md:aspect-auto md:row-span-2 relative cursor-pointer group bg-muted"
            onClick={() => openLightbox(0)}
          >
            <img src={images[0]} alt={property.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          </div>

          {/* Thumbnails */}
          {images.slice(1, 3).map((img, i) => (
            <div
              key={i}
              className="hidden md:block aspect-[4/3] relative cursor-pointer group bg-muted"
              onClick={() => openLightbox(i + 1)}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              {i === 1 && images.length > 3 && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <span className="font-nav text-xs uppercase tracking-wider text-foreground">
                    View all {images.length} photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Mobile gallery dots */}
        <div className="md:hidden flex justify-center gap-2 mt-4">
          {images.slice(0, 5).map((_, i) => (
            <button key={i} onClick={() => openLightbox(i)} className="w-2 h-2 rounded-full bg-muted-foreground/40 hover:bg-primary transition-colors" />
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left column */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                  {property.transactionType === 'sale' ? t('properties.forSale') : t('properties.forRent')}
                </span>
                <span className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1 rounded-sm">
                  {property.propertyType}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px gold-gradient mb-8" />

              {/* Description */}
              {property.description && (
                <div
                  className="prose-estoria mb-12"
                  dangerouslySetInnerHTML={{ __html: property.description }}
                />
              )}

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-heading text-2xl text-foreground mb-6">Features & Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map(f => (
                      <div key={f} className="flex items-center gap-2 bg-secondary border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground">
                        <Check size={14} className="text-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map placeholder */}
              {property.lat && property.lng && (
                <div className="mb-12">
                  <h2 className="font-heading text-2xl text-foreground mb-6">Location</h2>
                  <div className="aspect-[16/9] bg-secondary rounded-sm border border-border flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin size={32} className="mx-auto mb-2 text-primary" />
                      <p className="font-body text-sm">{property.address}</p>
                      <p className="font-body text-xs mt-1">Map integration available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar properties */}
              {similarProperties.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl text-foreground mb-6">Similar Properties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <h3 className="font-heading text-xl text-foreground mb-5">Property Details</h3>
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

              {/* Agent card */}
              {property.agent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-sm p-6"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <img
                      src={property.agent.imageUrl}
                      alt={property.agent.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-heading text-lg text-foreground">{property.agent.name}</h4>
                      <p className="text-xs text-primary font-nav uppercase tracking-wider">{property.agent.role}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <a href={`tel:${property.agent.phone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors">
                      <Phone size={14} /> {property.agent.phone}
                    </a>
                    <a href={`mailto:${property.agent.email}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors">
                      <Mail size={14} /> {property.agent.email}
                    </a>
                  </div>

                  {property.agent.languages && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {property.agent.languages.map(lang => (
                        <span key={lang} className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-2.5 py-1 rounded-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href="#contact-form"
                    className="block w-full text-center gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    Contact Agent
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
                <h3 className="font-heading text-xl text-foreground mb-5">Send a Message</h3>

                {formSent ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="text-success" size={20} />
                    </div>
                    <p className="text-foreground font-body text-sm">Message sent successfully!</p>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={formData.name}
                      onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={formData.phone}
                      onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    <textarea
                      placeholder={`I'm interested in "${property.title}"`}
                      rows={3}
                      required
                      value={formData.message}
                      onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-4 py-3 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 border border-border text-muted-foreground hover:text-primary hover:border-primary py-3 rounded-sm font-nav text-xs uppercase tracking-wider transition-colors"
              >
                {copied ? <><Check size={14} /> Link Copied!</> : <><Share2 size={14} /> Share Property</>}
              </button>
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
          Contact
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
          >
            <button
              className="absolute top-6 right-6 text-foreground hover:text-primary z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Counter */}
            <span className="absolute top-6 left-6 font-nav text-xs uppercase tracking-wider text-muted-foreground">
              {lightboxIndex + 1} / {images.length}
            </span>

            {/* Nav */}
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-foreground hover:text-primary z-10"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-foreground hover:text-primary z-10"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={32} />
            </button>

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={images[lightboxIndex]}
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
