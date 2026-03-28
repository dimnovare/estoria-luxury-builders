import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Home, TrendingUp, FileCheck, Scale, Paintbrush } from 'lucide-react';
import { mockServices } from '@/data/mockContent';

const iconMap: Record<string, typeof Building2> = {
  Building2, Home, TrendingUp, FileCheck, Scale, Paintbrush,
};

export default function Services() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.services')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-3">Our Services</h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              Comprehensive real estate solutions tailored to your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Alternating service sections */}
      <section className="py-16">
        {mockServices.map((service, i) => {
          const Icon = iconMap[service.icon] || Building2;
          const isEven = i % 2 === 1;

          return (
            <div key={service.id}>
              <div className="container mx-auto px-6 py-16">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? '' : ''}`}>
                  {/* Content side */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className={isEven ? 'lg:order-2' : ''}
                  >
                    <Icon className="text-primary mb-5" size={36} />
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground font-light mb-4">
                      {service.title}
                    </h2>
                    <p className="text-muted-foreground font-body leading-relaxed mb-4">
                      {service.description}
                    </p>
                    {service.price && (
                      <p className="text-primary font-nav text-xs uppercase tracking-wider">
                        {service.price}
                      </p>
                    )}
                  </motion.div>

                  {/* Decorative side */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className={isEven ? 'lg:order-1' : ''}
                  >
                    <div className="aspect-[4/3] bg-card border border-border rounded-sm flex items-center justify-center relative overflow-hidden">
                      {/* Abstract decorative pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-primary rounded-full" />
                        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-primary/50 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-px gold-gradient" />
                      </div>
                      <Icon className="text-primary/20" size={80} />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Divider */}
              {i < mockServices.length - 1 && (
                <div className="container mx-auto px-6">
                  <div className="h-px bg-border relative overflow-hidden">
                    <div className="absolute left-1/2 -translate-x-1/2 w-24 h-px gold-gradient" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 border-t border-primary/20">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground mb-4">
              Need help? Contact us for a free consultation
            </h2>
            <p className="text-muted-foreground font-body mb-10 max-w-lg mx-auto">
              Our experts are ready to discuss your specific needs and create a tailored solution.
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
