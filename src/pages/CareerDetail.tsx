import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft } from 'lucide-react';
import { mockCareers } from '@/data/mockContent';
import { useEffect } from 'react';

export default function CareerDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const career = mockCareers.find(c => c.slug === slug);

  useEffect(() => {
    if (career) {
      document.title = `${career.title} — Careers — ESTORIA`;
    }
    return () => { document.title = 'ESTORIA — Where Your Future Lives'; };
  }, [career]);

  if (!career) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-5xl text-foreground mb-4">{t('common.notFound')}</h1>
          <Link to="/careers" className="text-primary font-nav text-xs uppercase tracking-wider hover:underline">
            ← All Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 pb-4 container mx-auto px-6">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/careers" className="hover:text-primary transition-colors">Careers</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{career.title}</span>
        </nav>
      </div>

      <section className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground font-light mb-4">
            {career.title}
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
              <MapPin size={14} className="text-primary" />
              {career.location}
            </span>
            <span className="text-[10px] font-nav uppercase tracking-wider bg-secondary text-muted-foreground px-3 py-1.5 rounded-sm">
              {career.type}
            </span>
          </div>

          <div className="h-px gold-gradient mb-10" />

          {/* Description */}
          <div
            className="prose-estoria mb-12"
            dangerouslySetInnerHTML={{ __html: career.description }}
          />

          {/* Apply CTA */}
          <a
            href={`mailto:careers@estoria.ee?subject=Application: ${encodeURIComponent(career.title)}`}
            className="inline-block gold-gradient text-primary-foreground px-10 py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
          >
            Apply Now
          </a>
        </motion.div>
      </section>

      {/* Back link */}
      <div className="container mx-auto px-6 pb-16 max-w-4xl">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-nav uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} /> All Positions
        </Link>
      </div>
    </>
  );
}
