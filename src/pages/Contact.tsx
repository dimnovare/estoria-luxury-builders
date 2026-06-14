import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Check, Loader2, Instagram, Facebook, Linkedin } from 'lucide-react';
import { z } from 'zod';
import api from '@/lib/api';
import { useProperty } from '@/hooks/api/useProperties';
import { useSiteSettings } from '@/hooks/api/useSiteSettings';
import { usePageContent } from '@/hooks/api/useContent';
import Seo from '@/components/Seo';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

export default function Contact() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const propertySlug = searchParams.get('property') || undefined;

  const { data: linkedProperty } = useProperty(propertySlug);
  const { data: settings } = useSiteSettings();
  const { data: contactHero } = usePageContent('contact.hero');

  const contactEmail   = settings?.['contact.email']   || 'info@estoria.estate';
  const contactPhone   = settings?.['contact.phone']   || '+372 600 0000';
  const contactAddress = settings?.['contact.address'] || 'Pärnu mnt 15, 10141 Tallinn, Estonia';
  const contactHours   = settings?.['contact.hours']   || '';
  const phoneHref      = `tel:${contactPhone.replace(/\s+/g, '')}`;

  const socialLinks = [
    { Icon: Instagram, label: 'Instagram', href: settings?.['social.instagram'] },
    { Icon: Facebook,  label: 'Facebook',  href: settings?.['social.facebook']  },
    { Icon: Linkedin,  label: 'LinkedIn',  href: settings?.['social.linkedin']  },
  ].filter((s) => s.href && s.href.trim().length > 0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form when linked property loads
  useEffect(() => {
    if (linkedProperty) {
      setForm((f) => ({
        ...f,
        subject: f.subject || t('contact.inquiry.subject', { title: linkedProperty.title }),
        message:
          f.message ||
          t('contact.inquiry.message', {
            title: linkedProperty.title,
            address: linkedProperty.address,
          }),
      }));
    }
  }, [linkedProperty, t]);

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus('loading');
    try {
      await api.post('/contact', {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        subject: form.subject || null,
        message: form.message,
        propertyId: linkedProperty?.id || null,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Seo
        title={t('seo.contact.title', 'Contact Estoria — Tallinn Real Estate Office')}
        description={t('seo.contact.description', 'Reach Estoria in Tallinn for sales, rentals, and investment enquiries. Visit our office or message our brokers directly.')}
        path="/contact"
      />
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.contact')}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-light text-foreground mb-3 break-words">
              {t('nav.contact')}
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              {contactHero?.body || t('contact.headerLead')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left — Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {linkedProperty && (
                <div className="bg-card border border-border rounded-sm p-4 mb-6 flex items-center gap-3">
                  {linkedProperty.coverImageUrl && (
                    <img
                      src={linkedProperty.coverImageUrl}
                      alt=""
                      className="w-16 h-12 rounded-sm object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground font-body">{t('contact.inquiry.about')}</p>
                    <Link
                      to={`/properties/${linkedProperty.slug}`}
                      className="text-sm text-primary font-body hover:underline"
                    >
                      {linkedProperty.title}
                    </Link>
                  </div>
                </div>
              )}

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="text-success" size={28} aria-hidden="true" />
                  </div>
                  <h2 className="font-heading text-3xl text-foreground mb-3">{t('contact.success.title')}</h2>
                  <p className="text-muted-foreground font-body">
                    {t('contact.success.subtitle')}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      placeholder={t('contact.form.namePlaceholder')}
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.name && (
                      <p className="text-destructive text-xs mt-1 font-body">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder={t('contact.form.emailPlaceholder')}
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1 font-body">{errors.email}</p>
                    )}
                  </div>
                  <input
                    type="tel"
                    placeholder={t('contact.form.phonePlaceholder')}
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder={t('contact.form.subjectPlaceholder')}
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  />
                  <div>
                    <textarea
                      placeholder={t('contact.form.messagePlaceholder')}
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="w-full bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                    />
                    {errors.message && (
                      <p className="text-destructive text-xs mt-1 font-body">{errors.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full gold-gradient text-primary-foreground py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                    {t('contact.form.send')}
                  </button>
                  {status === 'error' && (
                    <p className="text-destructive text-sm font-body text-center">
                      {t('contact.form.error')}
                    </p>
                  )}
                </form>
              )}
            </motion.div>

            {/* Right — Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-10"
            >
              {/* Contact details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">
                      {t('contact.info.address')}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {contactAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">
                      {t('contact.info.phone')}
                    </h3>
                    <a
                      href={phoneHref}
                      className="text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                    >
                      {contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">
                      {t('contact.info.email')}
                    </h3>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-1">
                      {t('contact.info.hours')}
                    </h3>
                    {contactHours ? (
                      <p className="text-sm text-muted-foreground font-body whitespace-pre-line">
                        {contactHours}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground font-body">{t('contact.info.hoursWeekday')}</p>
                        <p className="text-sm text-muted-foreground font-body">
                          {t('contact.info.hoursSaturday')}
                        </p>
                        <p className="text-sm text-muted-foreground font-body">{t('contact.info.hoursSunday')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Map — coordinates come from contact.latitude/longitude
                  SiteSettings, auto-populated when admin edits the address.
                  Tallinn city-centre fallback so the map renders even if the
                  geocoder hasn't run or failed. */}
              {(() => {
                const lat = parseFloat(settings?.['contact.latitude'] ?? '') || 59.4370;
                const lng = parseFloat(settings?.['contact.longitude'] ?? '') || 24.7536;
                // 0.015° box ≈ ~1.6 km on the lat axis at this latitude —
                // enough zoom to identify the office without being lost.
                const bbox = `${(lng - 0.015).toFixed(4)}%2C${(lat - 0.0075).toFixed(4)}%2C${(lng + 0.015).toFixed(4)}%2C${(lat + 0.0075).toFixed(4)}`;
                const marker = `${lat.toFixed(4)}%2C${lng.toFixed(4)}`;
                return (
                  <div className="rounded-sm overflow-hidden border border-border">
                    <iframe
                      title={t('contact.mapTitle', 'ESTORIA Office Location')}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
                      className="w-full h-[280px] border-0 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                      loading="lazy"
                    />
                  </div>
                );
              })()}

              {/* Social — only render icons whose URL is configured */}
              {socialLinks.length > 0 && (
                <div>
                  <h3 className="font-nav text-xs uppercase tracking-wider text-foreground mb-4">
                    {t('contact.followUs')}
                  </h3>
                  <div className="flex items-center gap-4">
                    {socialLinks.map(({ Icon, label, href }) => (
                      <a
                        key={label}
                        href={href}
                        aria-label={label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-sm bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-300"
                      >
                        <Icon size={18} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
