import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Mail } from 'lucide-react';
import { mockCareers } from '@/data/mockContent';

export default function Careers() {
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
              <span className="text-foreground">Careers</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-3">Join Our Team</h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl">
              Build your career at Estonia's leading luxury real estate brand.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          {mockCareers.length > 0 ? (
            <div className="space-y-4">
              {mockCareers.map((career, i) => (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={`/careers/${career.slug}`}
                    className="group flex items-center justify-between bg-card border border-border rounded-sm p-6 transition-all duration-300 hover:border-primary/30 hover:pl-8"
                  >
                    {/* Left gold border on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 gold-gradient transition-all duration-300 rounded-l-sm" />

                    <div className="flex-1">
                      <h3 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors">
                        {career.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                          <MapPin size={12} className="text-primary" />
                          {career.location}
                        </span>
                        <span className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-2.5 py-1 rounded-sm">
                          {career.type}
                        </span>
                      </div>
                    </div>

                    <span className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary font-nav uppercase tracking-wider transition-colors">
                      View Details <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <Mail className="text-primary mx-auto mb-6" size={40} />
              <h3 className="font-heading text-2xl text-foreground mb-3">No Current Openings</h3>
              <p className="text-muted-foreground font-body text-sm max-w-md mx-auto mb-6">
                We're always interested in hearing from talented people. Send us your CV and we'll keep you in mind for future opportunities.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                {t('nav.contactUs')}
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
