import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { useEffect } from 'react';
import { useTeamMember } from '@/hooks/api/useContent';

export default function TeamMemberDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: member, isLoading, error } = useTeamMember(slug);

  useEffect(() => {
    if (member) {
      document.title = `${member.name} — ESTORIA`;
    }
    return () => {
      document.title = 'ESTORIA — Where Your Future Lives';
    };
  }, [member]);

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-5xl text-foreground mb-4">{t('common.notFound')}</h1>
          <Link
            to="/team"
            className="text-primary font-nav text-xs uppercase tracking-wider hover:underline"
          >
            ← Back to Team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 pb-4 container mx-auto px-6">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
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
            <h1 className="font-heading text-4xl md:text-5xl text-foreground font-light mb-2">
              {member.name}
            </h1>
            <p className="text-primary font-nav text-xs uppercase tracking-[0.15em] mb-6">
              {member.role}
            </p>

            <div className="h-px gold-gradient mb-8" />

            {/* Bio */}
            {member.bio && (
              <div
                className="prose-estoria mb-8"
                dangerouslySetInnerHTML={{ __html: member.bio }}
              />
            )}

            {/* Contact */}
            <div className="space-y-3 mb-6">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                >
                  <Phone size={16} className="text-primary" /> {member.phone}
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary font-body transition-colors"
                >
                  <Mail size={16} className="text-primary" /> {member.email}
                </a>
              )}
            </div>

            {/* Languages */}
            {member.languages && member.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {member.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1.5 rounded-sm"
                  >
                    {lang}
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
              Properties by {member.name.split(' ')[0]}
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
              No active listings at this time.
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
          <ArrowLeft size={14} /> Back to Team
        </Link>
      </div>
    </>
  );
}
