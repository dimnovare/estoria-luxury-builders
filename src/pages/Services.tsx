import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices } from '@/hooks/api/useContent';
import { resolveServiceIcon } from '@/lib/serviceIconMap';

export default function Services() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: services, isLoading, error } = useServices();

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.services')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-3">
              {t('services.title')}
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              {t('services.subtitle')}
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
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            {(services ?? []).map((service, i) => {
              const Icon = resolveServiceIcon(service.iconName);
              const isLast = i === (services ?? []).length - 1;

              return (
                <motion.div
                  key={service.id}
                  id={service.slug || service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5 }}
                  className={`group relative border-t border-border ${isLast ? 'border-b' : ''} py-8 md:py-10 px-4 md:px-6 -mx-4 md:-mx-6 flex flex-col md:flex-row md:items-center gap-6 transition-colors duration-300 hover:bg-card/40 cursor-default`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center bg-[hsl(43_50%_54%/0.08)] text-primary border border-primary/20 group-hover:bg-[hsl(43_50%_54%/0.15)] transition-colors duration-300">
                    <Icon size={20} />
                  </div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {service.name}
                    </h2>
                    {service.description && (
                      <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed max-w-2xl">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Price + arrow */}
                  <div className="flex items-center gap-4 md:gap-6 md:text-right md:flex-col md:items-end md:gap-2">
                    {service.priceInfo && (
                      <span className="text-primary font-nav text-xs uppercase tracking-[0.15em] whitespace-nowrap">
                        {service.priceInfo}
                      </span>
                    )}
                    <ArrowRight
                      size={18}
                      className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block"
                    />
                  </div>
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
