import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLanguages, languageLabel } from '@/lib/languages';
import { motion } from 'framer-motion';
import { SafeHtml } from '@/components/SafeHtml';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import ContactActions from '@/components/ContactActions';
import Seo from '@/components/Seo';
import { useTeamMember } from '@/hooks/api/useContent';

export default function TeamMemberDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: member, isLoading, error } = useTeamMember(slug);

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2
          className="animate-spin text-primary"
          size={32}
          role="status"
          aria-label={t('common.loading', 'Loading')}
        />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-4 break-words">{t('common.notFound')}</h1>
          <Link
            to="/team"
            className="text-primary font-nav text-xs uppercase tracking-wider hover:underline"
          >
            {t('team.backToTeam')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={t('seo.teamMember.title', '{{name}} — {{role}} at Estoria', {
          name: member.name,
          role: member.role || t('team.defaultRole', 'Broker'),
        })}
        description={t(
          'seo.teamMember.description',
          '{{name}}, {{role}} at Estoria in Tallinn. Get in touch for premium real-estate guidance.',
          {
            name: member.name,
            role: member.role || t('team.defaultRoleLong', 'real-estate advisor'),
          }
        )}
        path={`/team/${member.slug}`}
        image={member.photoUrl}
      />
      <div className="pt-24 pb-4 container mx-auto px-6">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <Link to="/team" className="hover:text-primary transition-colors">
            {t('nav.team')}
          </Link>
          <span>/</span>
          <span className="text-foreground">{member.name}</span>
        </nav>
      </div>

      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2"
          >
            <div className="aspect-[3/4] rounded-sm overflow-hidden bg-muted">
              <img
                src={member.photoUrl || '/placeholder.jpg'}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground font-light mb-2 break-words">
              {member.name}
            </h1>
            <p className="text-primary font-nav text-xs uppercase tracking-[0.15em] mb-6">
              {member.role}
            </p>

            <div className="h-px gold-gradient mb-8" />

            {/* Bio */}
            {member.bio && (
              <SafeHtml className="prose-estoria mb-8" html={member.bio} />
            )}

            {/* Contact */}
            <div className="mb-6">
              <ContactActions
                phone={member.phone}
                email={member.email}
                variant="solid"
              />
            </div>

            {/* Languages */}
            {normalizeLanguages(member.languages).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {normalizeLanguages(member.languages).map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1.5 rounded-sm"
                  >
                    {languageLabel(lang, t)}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Properties by agent */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-px gold-gradient mb-6" />
            <h2 className="font-heading text-3xl text-foreground mb-10">
              {t('team.propertiesByAgent', { name: member.name.split(' ')[0] })}
            </h2>
          </motion.div>

          {member.properties && member.properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {member.properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-body text-sm">
              {t('team.noActiveListings')}
            </p>
          )}
        </div>
      </section>

      {/* Back link */}
      <div className="container mx-auto px-6 py-10">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-nav uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} /> {t('team.backLink')}
        </Link>
      </div>
    </>
  );
}
