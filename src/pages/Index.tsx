import { useState } from 'react';
import logoImg from '@/assets/logo.png';
import heroVideoAsset from '@/assets/hero-video.mp4.asset.json';
import Newsletter from '@/components/Newsletter';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Building2, Home, Landmark, TreePine, ChevronDown } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProperties } from '@/hooks/api/useProperties';
import { usePageContent, useServices } from '@/hooks/api/useContent';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = { Building2, Home, Landmark, TreePine };

const isDirectVideoUrl = (url?: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return false;
  if (lower.includes('vimeo.com')) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(lower) || lower.startsWith('blob:') || lower.includes('/video');
};

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [txType, setTxType] = useState<'buy' | 'rent'>('buy');

  const { data: featured, isLoading: featuredLoading } = useFeaturedProperties();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: hero } = usePageContent('homepage.hero');
  const { data: featuredContent } = usePageContent('homepage.featured');
  const { data: servicesContent } = usePageContent('homepage.services');
  const { data: aboutIntro } = usePageContent('about.intro');

  const heroVideoSrc = hero?.videoUrl || heroVideoAsset.url;

  const handleSearch = () => {
    navigate(`/properties?transaction=${txType}`);
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* BG Video / Image / Gradient fallback */}
        <div className="absolute inset-0">
          {isDirectVideoUrl(heroVideoSrc) ? (
            <video
              src={heroVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : hero?.imageUrl ? (
            <img
              src={hero.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.9) 100%)'
          }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-[72px]">
          {/* Gold line */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8 }}
            className="w-14 h-px gold-gradient mx-auto mb-6"
          />

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-nav text-[11px] tracking-[0.4em] text-primary uppercase mb-4"
          >
            Premium Real Estate · Tallinn · Estonia
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-5xl md:text-7xl lg:text-[88px] font-light text-foreground leading-[1.05]"
          >
            {hero?.title || (
              <>
                Where Your{' '}
                <span className="gold-gradient-text font-medium italic">Future</span> Lives
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 text-muted-foreground text-base md:text-[16px] font-body font-light max-w-[440px] mx-auto leading-[1.8]"
          >
            {hero?.body ||
              "Curated luxury properties across Estonia's most sought-after locations."}
          </motion.p>

          {/* Search Bar — Sovereign style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex flex-col md:flex-row bg-background/90 backdrop-blur-md border border-border max-w-[700px] mx-auto"
          >
            {/* Buy/Rent tabs */}
            <div className="flex border-b md:border-b-0 md:border-r border-border">
              {(['buy', 'rent'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTxType(type)}
                  className={`flex-1 md:flex-none px-5 md:px-[22px] h-[60px] flex items-center justify-center font-nav text-[11px] tracking-[0.15em] uppercase transition-colors border-b-2 ${
                    txType === type
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  {type === 'buy' ? t('hero.buy') : t('hero.rent')}
                </button>
              ))}
            </div>

            {/* City field */}
            <div className="flex-1 px-5 py-2.5 border-b md:border-b-0 md:border-r border-border">
              <div className="font-nav text-[9px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                {t('hero.allCities').replace('All ', '') || 'City'}
              </div>
              <select className="w-full bg-transparent text-foreground text-sm font-body border-none outline-none appearance-none cursor-pointer">
                <option>Tallinn</option>
                <option>Tartu</option>
                <option>Pärnu</option>
                <option>Narva</option>
              </select>
            </div>

            {/* Type field */}
            <div className="flex-1 px-5 py-2.5 border-b md:border-b-0 md:border-r border-border">
              <div className="font-nav text-[9px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                {t('hero.allTypes').replace('All ', '') || 'Type'}
              </div>
              <select className="w-full bg-transparent text-foreground text-sm font-body border-none outline-none appearance-none cursor-pointer">
                <option>{t('hero.allTypes')}</option>
                <option>{t('hero.apartment')}</option>
                <option>{t('hero.house')}</option>
                <option>{t('hero.commercial')}</option>
                <option>{t('hero.land')}</option>
              </select>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="gold-gradient text-primary-foreground px-8 py-4 md:py-0 font-nav text-[11px] font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <Search size={16} strokeWidth={2.5} />
              {t('hero.search')}
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="hidden md:flex justify-center gap-12 mt-12"
          >
            {[
              ['120+', 'Properties'],
              ['8 yrs', 'Experience'],
              ['98%', 'Satisfaction'],
              ['ET · EN · RU', 'Languages'],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="font-heading text-[30px] font-semibold text-primary leading-none">
                  {value}
                </div>
                <div className="font-nav text-[9px] tracking-[0.25em] text-muted-foreground uppercase mt-1">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center hidden md:block"
        >
          <div className="font-nav text-[9px] tracking-[0.25em] text-muted-foreground uppercase mb-1.5">
            Discover
          </div>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="text-muted-foreground mx-auto" size={16} strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURED PROPERTIES ===== */}
      {(!featured || featured.length > 0 || featuredLoading) && (
      <section className="py-24 px-6 md:px-16 bg-card">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-[52px]"
          >
            <div>
              <div className="w-10 h-px gold-gradient mb-5" />
              <div className="font-nav text-[10px] tracking-[0.3em] text-primary uppercase mb-3">
                Curated Selection
              </div>
              <h2 className="font-heading text-4xl md:text-[48px] font-light text-foreground leading-[1.1]">
                {featuredContent?.title || 'Featured Properties'}
              </h2>
            </div>
            <div className="mt-5 md:mt-0">
              <button
                onClick={() => navigate('/properties')}
                className="font-nav text-[11px] uppercase tracking-[0.18em] border border-primary text-primary px-6 py-2.5 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                {t('properties.viewAll')} →
              </button>
            </div>
          </motion.div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border">
                  <Skeleton className="aspect-[4/3]" />
                  <div className="p-6">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
              {(featured ?? []).map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ===== SERVICES ===== */}
      {(!services || services.length > 0 || servicesLoading) && (
      <section className="py-24 px-6 md:px-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="w-10 h-px gold-gradient mx-auto mb-5" />
            <div className="font-nav text-[10px] tracking-[0.3em] text-primary uppercase mb-3">
              What We Offer
            </div>
            <h2 className="font-heading text-4xl md:text-[48px] font-light text-foreground">
              {servicesContent?.title || 'Our Services'}
            </h2>
          </motion.div>

          {servicesLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border p-10">
                  <Skeleton className="h-11 w-11 rounded-full mb-6" />
                  <Skeleton className="h-5 w-2/3 mb-3" />
                  <Skeleton className="h-4 w-full mb-1.5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5">
              {(services ?? []).map((service, i) => {
                const Icon = (service.iconName && iconMap[service.iconName]) || Building2;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate('/services')}
                    className="group border border-border p-8 md:p-10 cursor-pointer transition-all duration-300 hover:border-primary hover:bg-[rgba(201,168,76,0.03)]"
                  >
                    <div className="w-11 h-11 border border-primary rounded-full flex items-center justify-center mb-6">
                      <Icon className="text-primary" size={18} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-heading text-xl md:text-[21px] font-medium text-foreground mb-2.5">
                      {service.name}
                    </h3>
                    <p className="text-[13px] text-muted-foreground font-body leading-[1.7]">
                      {service.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ===== ABOUT TEASER ===== */}
      <section className="bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden"
          >
            <img
              src={
                aboutIntro?.imageUrl ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
              }
              alt="About Estoria"
              className="w-full h-[260px] lg:h-full lg:min-h-[480px] object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center px-6 py-12 md:px-[72px] md:py-20"
          >
            <div className="w-10 h-px gold-gradient mb-5" />
            <div className="font-nav text-[10px] tracking-[0.3em] text-primary uppercase mb-3.5">
              Our Story
            </div>
            <h2 className="font-heading text-4xl md:text-[44px] font-light text-foreground leading-[1.15] mb-5">
              {aboutIntro?.title || (
                <>
                  Built on Trust,<br />
                  Driven by <span className="italic text-primary">Excellence</span>
                </>
              )}
            </h2>
            {aboutIntro?.body ? (
              <div
                className="text-muted-foreground font-body text-sm leading-[1.85] max-w-[380px] mb-8"
                dangerouslySetInnerHTML={{ __html: aboutIntro.body }}
              />
            ) : (
              <p className="text-muted-foreground font-body text-sm leading-[1.85] max-w-[380px] mb-8">
                With over 8 years serving Estonia's most discerning clients, we've built our
                reputation on integrity, deep market knowledge, and a genuine passion for
                connecting people with exceptional homes.
              </p>
            )}
            <div>
              <button
                onClick={() => navigate('/about')}
                className="font-nav text-[11px] font-semibold uppercase tracking-[0.18em] border border-primary text-primary px-8 py-3.5 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                Our Story →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="py-20 px-6 border-t border-b border-border">
        <div className="container mx-auto max-w-[480px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-10 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-4xl md:text-[44px] font-light text-foreground mb-2">
              {t('newsletter.title')}
            </h2>
            <p className="text-muted-foreground font-body text-sm mb-8">{t('newsletter.subtitle')}</p>
            <Newsletter variant="section" />
          </motion.div>
        </div>
      </section>
    </>
  );
}
