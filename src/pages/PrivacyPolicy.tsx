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

  const collectItems = t('privacy.sections.dataWeCollect.items', {
    returnObjects: true,
    defaultValue: [
      'Contact form — name, email address, phone number (optional), and your message. Lawful basis: your consent / legitimate interest in responding to your inquiry.',
      'Property inquiry — same as contact form, plus a reference to the property you are enquiring about.',
      'Newsletter subscription — email address and preferred language. Lawful basis: your explicit consent.',
    ],
  }) as string[];
  const useItems = t('privacy.sections.howWeUse.items', {
    returnObjects: true,
    defaultValue: [
      'Responding to your contact or property enquiry',
      'Sending newsletter emails you have subscribed to',
      'Improving our services based on the enquiries we receive',
    ],
  }) as string[];
  const rightsItems = t('privacy.sections.rights.items', {
    returnObjects: true,
    defaultValue: [
      'Access — request a copy of the personal data we hold about you',
      'Rectification — correct inaccurate or incomplete data',
      'Erasure — request deletion of your data',
      'Restriction — ask us to pause processing your data',
      'Portability — receive your data in a machine-readable format',
      'Objection — object to processing based on legitimate interest',
      'Withdraw consent — unsubscribe from the newsletter at any time',
    ],
  }) as string[];

  return (
    <>
      <Seo
        title={t('seo.privacy.title', 'Privacy Policy — Estoria')}
        description={t('seo.privacy.description', 'How Estoria collects, uses, and protects your personal data, and your rights under GDPR.')}
        path="/privacy"
      />
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home', 'Home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('footer.privacy', 'Privacy Policy')}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-light text-foreground break-words">
              {t('footer.privacy', 'Privacy Policy')}
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
            {t('privacy.lastUpdated', 'Last updated:')} {formatDate(POLICY_DATE)}
          </p>

          <div className="space-y-10 font-body text-muted-foreground leading-relaxed">

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.whoWeAre.heading', '1. Who We Are')}
              </h2>
              <p>
                {t('privacy.sections.whoWeAre.intro', '{{companyName}} (registry code: {{registryCode}}), registered address {{contactAddress}}, is the data controller responsible for the personal data collected through this website (estoria.estate).', {
                  companyName,
                  registryCode,
                  contactAddress,
                })}
              </p>
              <p className="mt-2">
                {t('privacy.sections.whoWeAre.contactLabel', 'Contact:')}{' '}
                <a href="mailto:info@estoria.estate" className="text-primary hover:underline">info@estoria.estate</a>
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.dataWeCollect.heading', '2. Data We Collect')}
              </h2>
              <p>{t('privacy.sections.dataWeCollect.intro', 'We collect personal data in the following situations:')}</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                {collectItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.dataWeCollect.note', 'We do not collect sensitive personal data (health, financial, or identity documents) through this website.')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.howWeUse.heading', '3. How We Use Your Data')}
              </h2>
              <ul className="space-y-2 list-disc list-inside">
                {useItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.howWeUse.note', 'We do not sell, rent, or share your personal data with third parties for their own marketing purposes.')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.retention.heading', '4. Data Retention')}
              </h2>
              <p>
                {t('privacy.sections.retention.body', 'Contact and inquiry messages are retained for up to 3 years from the date of submission, after which they are deleted. Newsletter subscriptions are retained until you unsubscribe.')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.rights.heading', '5. Your Rights Under GDPR')}
              </h2>
              <p>{t('privacy.sections.rights.intro', 'As a data subject you have the right to:')}</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                {rightsItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3">
                {t('privacy.sections.rights.contactBefore', 'To exercise any of these rights, email us at ')}
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
                {t('privacy.sections.rights.contactAfter', '. We will respond within 30 days.')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.cookies.heading', '6. Cookies')}
              </h2>
              <p>
                {t('privacy.sections.cookies.body', 'This website uses only technically necessary cookies required for basic functionality (e.g. language preference). We do not use advertising or tracking cookies.')}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-foreground font-light mb-4">
                {t('privacy.sections.complaints.heading', '7. Complaints')}
              </h2>
              <p>
                {t('privacy.sections.complaints.before', 'You have the right to lodge a complaint with the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon) at ')}
                <a
                  href="https://www.aki.ee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.aki.ee
                </a>
                {t('privacy.sections.complaints.after', ' if you believe we are processing your data unlawfully.')}
              </p>
            </div>

          </div>
        </motion.article>
      </section>
    </>
  );
}
