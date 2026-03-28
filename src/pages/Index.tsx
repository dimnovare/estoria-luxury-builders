import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Building2, Home, Landmark, TreePine, ArrowDown } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { allMockProperties } from '@/data/mockProperties';

const mockProperties = allMockProperties.slice(0, 3);

const mockServices = [
  { icon: 'Building2', title: 'Property Sales', description: 'Expert guidance through every step of buying or selling premium real estate in Estonia.' },
  { icon: 'Home', title: 'Rental Management', description: 'Full-service property management for discerning landlords and tenants.' },
  { icon: 'Landmark', title: 'Investment Advisory', description: 'Strategic real estate investment consulting for maximum returns.' },
  { icon: 'TreePine', title: 'Valuation Services', description: 'Accurate market valuations backed by deep local expertise and data.' },
];

const iconMap: Record<string, typeof Building2> = { Building2, Home, Landmark, TreePine };

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [txType, setTxType] = useState<'buy' | 'rent'>('buy');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSearch = () => {
    navigate(`/properties?transaction=${txType}`);
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* BG Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Luxury estate"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 dark-overlay" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Gold mark */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="animate-float mb-8"
          >
            <div className="w-16 h-16 mx-auto border border-primary rounded-sm flex items-center justify-center">
              <Building2 className="text-primary" size={28} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-5xl md:text-7xl lg:text-8xl font-light text-foreground leading-tight"
          >
            Where Your Future{' '}
            <span className="gold-gradient-text font-medium italic">Lives</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-muted-foreground text-lg md:text-xl font-body max-w-2xl mx-auto"
          >
            Discover Estonia's most exclusive properties, curated for those who demand excellence.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 bg-background/80 backdrop-blur-md border border-border rounded-sm p-2 flex flex-col md:flex-row items-stretch gap-2"
          >
            <select className="flex-1 bg-secondary text-foreground text-sm font-body px-4 py-3 rounded-sm border-none outline-none appearance-none cursor-pointer">
              <option>{t('hero.allCities')}</option>
              <option>Tallinn</option>
              <option>Tartu</option>
              <option>Pärnu</option>
            </select>

            <select className="flex-1 bg-secondary text-foreground text-sm font-body px-4 py-3 rounded-sm border-none outline-none appearance-none cursor-pointer">
              <option>{t('hero.allTypes')}</option>
              <option>{t('hero.apartment')}</option>
              <option>{t('hero.house')}</option>
              <option>{t('hero.commercial')}</option>
              <option>{t('hero.land')}</option>
            </select>

            <div className="flex rounded-sm overflow-hidden border border-border">
              <button
                onClick={() => setTxType('buy')}
                className={`flex-1 px-5 py-3 text-xs font-nav uppercase tracking-wider transition-colors ${
                  txType === 'buy' ? 'gold-gradient text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('hero.buy')}
              </button>
              <button
                onClick={() => setTxType('rent')}
                className={`flex-1 px-5 py-3 text-xs font-nav uppercase tracking-wider transition-colors ${
                  txType === 'rent' ? 'gold-gradient text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('hero.rent')}
              </button>
            </div>

            <button
              onClick={handleSearch}
              className="gold-gradient text-primary-foreground px-8 py-3 rounded-sm font-nav text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Search size={14} />
              {t('hero.search')}
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="text-primary" size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURED PROPERTIES ===== */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">
              Featured Properties
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockProperties.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <button
              onClick={() => navigate('/properties')}
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t('properties.viewAll')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground">
              Our Services
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockServices.map((service, i) => {
              const Icon = iconMap[service.icon] || Building2;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-card border border-border rounded-sm p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)]"
                >
                  <Icon className="text-primary mb-5" size={28} />
                  <h3 className="font-heading text-xl text-foreground mb-3">{service.title}</h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{service.description}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <button
              onClick={() => navigate('/services')}
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t('services.viewAll')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT TEASER ===== */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-3 overflow-hidden rounded-sm"
            >
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
                alt="About Estoria"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="w-12 h-px gold-gradient mb-6" />
              <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-6">
                A Legacy of <span className="italic text-primary">Excellence</span>
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-4">
                ESTORIA represents the pinnacle of real estate excellence in Estonia.
                With decades of combined experience, our team curates exceptional properties
                for those who refuse to compromise.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed mb-8">
                From historic Old Town residences to contemporary waterfront estates,
                we connect discerning clients with spaces that define their future.
              </p>
              <button
                onClick={() => navigate('/about')}
                className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                {t('about.learnMore')}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="py-24 px-6 border-t border-b border-primary/20">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4">
              {t('newsletter.title')}
            </h2>
            <p className="text-muted-foreground font-body mb-10">
              {t('newsletter.subtitle')}
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-success font-body flex items-center justify-center gap-2"
              >
                <span className="text-lg">✓</span> {t('newsletter.success')}
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletter.placeholder')}
                  required
                  className="flex-1 bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="gold-gradient text-primary-foreground px-8 py-3.5 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  {t('newsletter.subscribe')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
