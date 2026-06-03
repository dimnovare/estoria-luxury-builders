import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { useCareer } from '@/hooks/api/useContent';
import { SafeHtml } from '@/components/SafeHtml';
import Seo from '@/components/Seo';

export default function CareerDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: career, isLoading, error } = useCareer(slug);

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-5xl text-foreground mb-4">{t('common.notFound')}</h1>
          <Link
            to="/careers"
            className="text-primary font-nav text-xs uppercase tracking-wider hover:underline"
          >
            {t('careers.allPositions')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${career.title} — Careers at Estoria`}
        description={`${career.title} — career opportunity at Estoria${career.location ? ` in ${career.location}` : ''}, Tallinn.`}
        path={`/careers/${career.slug}`}
      />
      <div className="pt-24 pb-4 container mx-auto px-6">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Link to="/" className="hover:text-primary transition-colors">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <Link to="/careers" className="hover:text-primary transition-colors">
            {t('nav.careers')}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{career.title}</span>
        </nav>
      </div>

      <section className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground font-light mb-4">
            {career.title}
          </h1>

          {career.location && (
            <div className="flex items-center gap-4 mb-8">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                <MapPin size={14} className="text-primary" />
                {career.location}
              </span>
            </div>
          )}

          <div className="h-px gold-gradient mb-10" />

          {/* Description */}
          {career.description && (
            <SafeHtml className="prose-estoria mb-12" html={career.description} />
          )}

          {/* Apply CTA */}
          {/* TODO P0.2: read from useSiteSettings hook once it lands */}
          <a
            href={`mailto:careers@estoria.estate?subject=Application: ${encodeURIComponent(career.title)}`}
            className="inline-block gold-gradient text-primary-foreground px-10 py-4 rounded-sm font-nav text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
          >
            {t('careers.applyNow')}
          </a>
        </motion.div>
      </section>

      {/* Back link */}
      <div className="container mx-auto px-6 pb-16 max-w-4xl">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-nav uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} /> {t('careers.backLink')}
        </Link>
      </div>
    </>
  );
}
