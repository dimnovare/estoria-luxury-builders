import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeam } from '@/hooks/api/useContent';

const reveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Team() {
  const { t } = useTranslation();
  const { data: team, isLoading, error } = useTeam();

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.team')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-3">
              Our Team
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              The experts behind Estonia's most exclusive properties.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-sm mb-5" />
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/3 mb-3" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-10 rounded-sm" />
                    <Skeleton className="h-5 w-10 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <p className="text-muted-foreground font-body">
                Failed to load team. Please try again.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(team ?? []).map((member, i) => (
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
                    <div className="mt-5">
                      <h3 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-xs text-primary font-nav uppercase tracking-wider mt-1">
                        {member.role}
                      </p>

                      {/* Languages */}
                      {member.languages && member.languages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {member.languages.map((lang) => (
                            <span
                              key={lang}
                              className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded-sm"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Contact icons */}
                      <div className="flex items-center gap-3 mt-3">
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
