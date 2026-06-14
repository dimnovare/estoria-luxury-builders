import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices, usePageContent } from '@/hooks/api/useContent';
import { resolveServiceIcon } from '@/lib/serviceIconMap';
import Seo from '@/components/Seo';

export default function Services() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: services, isLoading, error } = useServices();
  const { data: servicesHero } = usePageContent('services.hero');

  return (
    <>
      <Seo
        title={t('seo.services.title', 'Services — Sales, Rentals, Valuation & Investment | Estoria')}
        description={t('seo.services.description', 'Full-service real estate in Estonia: brokerage for sales and rentals, property valuation, and investment advisory tailored to private clients.')}
        path="/services"
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
              <span className="text-foreground">{t('nav.services')}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-light text-foreground mb-3 break-words">
              {servicesHero?.title || t('services.title')}
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              {servicesHero?.body || t('services.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Editorial service list */}
      {isLoading ? (
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-t border-border py-8 flex items-start gap-6">
                <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-20 hidden md:block" />
              </div>
            ))}
          </div>
        </section>
      ) : error ? (
        <div className="text-center py-32">
          <p className="text-muted-foreground font-body">
            {t('services.loadFailed')}
          </p>
        </div>
      ) : (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6 max-w-5xl">
            {(services ?? []).map((service, i) => {
              const Icon = resolveServiceIcon(service.iconName);
              const isLast = i === (services ?? []).length - 1;
              const num = String(i + 1).padStart(2, '0');

              return (
                <motion.div
                  key={service.id}
                  id={service.slug || service.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`group relative scroll-mt-24 ${!isLast ? 'border-b border-border/60' : ''} py-10 md:py-12 px-4 md:px-8 -mx-4 md:-mx-8 grid grid-cols-[auto_1fr] md:grid-cols-[60px_auto_1fr_auto] items-start gap-x-5 md:gap-x-8 gap-y-3 transition-colors duration-500 hover:bg-card/30 rounded-sm`}
                >
                  {/* Left accent bar (animated) */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-0 bg-primary group-hover:h-3/4 transition-all duration-500 ease-out"
                  />

                  {/* Index number (editorial) */}
                  <span className="hidden md:block font-nav text-[11px] tracking-[0.25em] text-muted-foreground/60 pt-3">
                    {num}
                  </span>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-md flex-shrink-0 flex items-center justify-center bg-primary/[0.06] text-primary border border-primary/15 group-hover:border-primary/40 group-hover:bg-primary/[0.1] transition-all duration-500">
                    <Icon size={20} strokeWidth={1.5} aria-hidden />
                  </div>

                  {/* Title + description */}
                  <div className="col-span-2 md:col-span-1 min-w-0">
                    <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-2 leading-tight break-words">
                      {service.name}
                    </h2>
                    {service.description && (
                      <p className="text-muted-foreground font-body text-sm md:text-[15px] leading-relaxed max-w-xl">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  {service.priceInfo && (
                    <div className="col-span-2 md:col-span-1 md:pt-3 md:text-right">
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
                        {t('services.priceLabel', { defaultValue: 'Pricing' })}
                      </span>
                      <span className="text-primary font-nav text-xs uppercase tracking-[0.18em] leading-relaxed">
                        {service.priceInfo}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-24 px-6 border-t border-primary/20">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mb-4">
              {t('services.ctaTitle')}
            </h2>
            <p className="text-muted-foreground font-body mb-10 max-w-lg mx-auto">
              {t('services.ctaSubtitle')}
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="gold-gradient text-primary-foreground px-10 py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
            >
              {t('nav.contactUs')}
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
