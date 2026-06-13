// ET/RU privacy translations are machine-generated and should be reviewed by the owner/legal.
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/hooks/api/useSiteSettings';
import { formatDate } from '@/lib/formatDate';
import Seo from '@/components/Seo';

// Fixed policy date so the "last updated" line doesn't change daily.
const POLICY_DATE = '2026-06-03';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const { data: settings } = useSiteSettings();
  const contactEmail   = settings?.['contact.email']         || 'info@estoria.estate';
  const companyName    = settings?.['legal.company_name']    || 'ESTORIA CAPITAL GROUP OÜ';
  const registryCode   = settings?.['legal.registry_code']   || '17477775';
  const contactAddress = settings?.['contact.address']       || 'Katusepapi 6, Tallinn 11412, Estonia';

  const collectItems = t('privacy.sections.dataWeCollect.items', { returnObjects: true }) as string[];
  const useItems     = t('privacy.sections.howWeUse.items', { returnObjects: true }) as string[];
  const rightsItems  = t('privacy.sections.rights.items', { returnObjects: true }) as string[];

  return (
    <>
      <Seo
        title="Privacy Policy — Estoria"
        description="How Estoria collects, uses, and protects your personal data, and your rights under GDPR."
        path="/privacy"
      />
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('footer.privacy')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground">
              {t('footer.privacy')}
            </h1>
            <div className="w-16 h-px gold-gradient mt-4" />
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="container mx-auto max-w-3xl prose prose-invert prose-headings:font-heading prose-headings:font-light prose-p:font-body prose-p:text-muted-foreground prose-a:text-primary"
        >
          <p className="text-sm text-muted-foreground font-body mb-8">
            {t('privacy.lastUpdated')} {formatDate(POLICY_DATE)}
          </p>

          <div className="space-y-10 font-body text-muted-foreground leading-relaxed">

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.whoWeAre.heading')}
              </h2>
              <p>
                {t('privacy.sections.whoWeAre.intro', {
                  companyName,
                  registryCode,
                  contactAddress,
                })}
              </p>
              <p className="mt-2">
                {t('privacy.sections.whoWeAre.contactLabel')}{' '}
                <a href="mailto:info@estoria.estate" className="text-primary hover:underline">info@estoria.estate</a>
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.dataWeCollect.heading')}
              </h2>
              <p>{t('privacy.sections.dataWeCollect.intro')}</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                {collectItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.dataWeCollect.note')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.howWeUse.heading')}
              </h2>
              <ul className="space-y-2 list-disc list-inside">
                {useItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.howWeUse.note')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.retention.heading')}
              </h2>
              <p>
                {t('privacy.sections.retention.body')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.rights.heading')}
              </h2>
              <p>{t('privacy.sections.rights.intro')}</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                {rightsItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.rights.contactBefore')}
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
                {t('privacy.sections.rights.contactAfter')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.cookies.heading')}
              </h2>
              <p>
                {t('privacy.sections.cookies.body')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.complaints.heading')}
              </h2>
              <p>
                {t('privacy.sections.complaints.before')}
                <a
                  href="https://www.aki.ee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.aki.ee
                </a>
                {t('privacy.sections.complaints.after')}
              </p>
            </div>

          </div>
        </motion.article>
      </section>
    </>
  );
}
