import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SafeHtml } from '@/components/SafeHtml';
import { Shield, Heart, Eye } from 'lucide-react';
import { useTeam, usePageContent } from '@/hooks/api/useContent';
import Seo from '@/components/Seo';

const valueIcons = [Shield, Heart, Eye];
const valueKeys = ['integrity', 'excellence', 'discretion'] as const;

const reveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

export default function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: team } = useTeam();
  const { data: intro } = usePageContent('about.intro');
  const { data: story } = usePageContent('about.story');
  const { data: valIntegrity }  = usePageContent('about.values.integrity');
  const { data: valExcellence } = usePageContent('about.values.excellence');
  const { data: valDiscretion } = usePageContent('about.values.discretion');
  const { data: aboutCta }      = usePageContent('about.cta');

  const valueData: Record<typeof valueKeys[number], typeof valIntegrity> = {
    integrity:  valIntegrity,
    excellence: valExcellence,
    discretion: valDiscretion,
  };

  const teamPreview = (team ?? []).slice(0, 3);

  return (
    <>
      <Seo
        title={t('seo.about.title', 'About Estoria — Tallinn Real Estate Brokerage')}
        description={t(
          'seo.about.description',
          'Meet Estoria: a Tallinn-based brokerage delivering discreet, expert service for premium apartments, houses, and commercial property in Estonia.',
        )}
        path="/about"
      />
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {/**
           * CMS-first: PageContent.about.intro.imageUrl renders if set; falls back
           * to a Tallinn old-town Unsplash photo otherwise. Editors can paste any
           * HTTPS image URL via /admin/pages → about.intro → imageUrl.
           */}
          <img
            src={
              intro?.imageUrl ||
              'https://images.unsplash.com/photo-1590497008439-79bc09b46a83?w=600&q=75'
            }
            alt={t('about.heroImageAlt', 'About Estoria')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="relative container mx-auto px-6 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-4">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.about')}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-light text-foreground break-words">
              {t('about.title')}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-1 h-16 gold-gradient rounded-full flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-6 break-words">
                    {intro?.title || (
                      <>
                        Redefining Luxury Real Estate in{' '}
                        <span className="italic text-primary">Estonia</span>
                      </>
                    )}
                  </h2>
                </div>
              </div>
              {intro?.body ? (
                <SafeHtml className="prose-estoria mt-6" html={intro.body} />
              ) : (
                <div className="prose-estoria mt-6">
                  <p>
                    ESTORIA was born from a simple belief: that finding your ideal home should be
                    an extraordinary experience, not a stressful one. We combine deep local
                    expertise with international standards of service to deliver results that exceed
                    expectations.
                  </p>
                  <p>
                    Since our founding, we have guided hundreds of discerning clients — from
                    first-time homeowners to seasoned investors — through the intricacies of
                    Estonia's premium property market. Our approach is personal, our standards are
                    uncompromising, and our commitment to your success is absolute.
                  </p>
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-4"
            >
              <div className="rounded-sm overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=75"
                  alt={t('about.officeImageAlt', 'ESTORIA office')}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-8" />
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-8 break-words">
              {story?.title || t('about.story.title', 'Our Story')}
            </h2>
            {story?.body ? (
              <SafeHtml className="prose-estoria text-center" html={story.body} />
            ) : (
              <div className="prose-estoria text-center">
                <p>
                  Founded in Tallinn in 2015, ESTORIA emerged at a pivotal moment in Estonia's
                  real estate landscape. As the country's economy flourished and international
                  interest in Baltic properties grew, there was a clear need for a real estate firm
                  that could match global luxury standards with authentic local knowledge.
                </p>
                <p>
                  What began as a boutique consultancy with three passionate professionals has
                  evolved into Estonia's most respected premium real estate brand. Today, our team
                  of fifteen specialists manages a curated portfolio of over 200 exclusive
                  properties across Tallinn, Tartu, and Pärnu.
                </p>
                <p>
                  Our name — ESTORIA — is a fusion of "Estonia" and "storia" (the Italian word for
                  story). Because every property has a story, and we believe finding the right one
                  is the beginning of yours.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground break-words">
              {t('about.ourValues')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueKeys.map((key, i) => {
              const Icon = valueIcons[i];
              const cms = valueData[key];
              return (
                <motion.div
                  key={key}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={reveal}
                  className="group bg-card border border-border rounded-sm p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)]"
                >
                  <Icon className="text-primary mb-5" size={28} />
                  <h3 className="font-heading text-xl text-foreground mb-3">
                    {cms?.title || t(`about.values.${key}.name`)}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {cms?.body || t(`about.values.${key}.description`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Teaser */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-12 h-px gold-gradient mx-auto mb-6" />
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground break-words">
              {t('about.meetTeam')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamPreview.map((member, i) => (
              <motion.div
                key={member.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={reveal}
              >
                <Link to={`/team/${member.slug}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-sm bg-muted border border-transparent group-hover:border-primary/30 transition-all duration-500">
                    <img
                      src={member.photoUrl || '/placeholder.jpg'}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-heading text-xl text-foreground">{member.name}</h3>
                    <p className="text-xs text-primary font-nav uppercase tracking-wider mt-1">
                      {member.role}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <button
              onClick={() => navigate('/team')}
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t('about.meetTeamButton')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 border-t border-primary/20">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-6 break-words">
              {aboutCta?.title || t('about.cta.title')}
            </h2>
            <p className="text-muted-foreground font-body mb-10 max-w-lg mx-auto">
              {aboutCta?.body || t('about.cta.subtitle')}
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="gold-gradient text-primary-foreground px-10 py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
            >
              {t('about.cta.button')}
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
