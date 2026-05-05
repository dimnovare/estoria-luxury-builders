import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import Newsletter from '@/components/Newsletter';
import { useSiteSettings } from '@/hooks/api/useSiteSettings';

const languages = ['et', 'en', 'ru'] as const;

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { data: settings } = useSiteSettings();

  const contactEmail   = settings?.['contact.email']   || 'info@estoria.estate';
  const contactPhone   = settings?.['contact.phone']   || '+372 600 0000';
  const contactAddress = settings?.['contact.address'] || t('footer.address');
  const companyName    = settings?.['legal.company_name']  || 'ESTORIA CAPITAL GROUP OÜ';
  const registryCode   = settings?.['legal.registry_code'] || '17477775';
  const social = [
    { href: settings?.['social.facebook'],  Icon: Facebook,  label: 'Facebook'  },
    { href: settings?.['social.instagram'], Icon: Instagram, label: 'Instagram' },
    { href: settings?.['social.linkedin'],  Icon: Linkedin,  label: 'LinkedIn'  },
  ].filter((s) => s.href && s.href.trim().length > 0);

  return (
    <footer className="bg-background border-t border-border">
      {/* Gold accent line */}
      <div className="h-px gold-gradient" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company */}
          <div>
            <Link to="/" className="font-heading text-2xl tracking-[0.3em] text-primary font-semibold">
              ESTORIA
            </Link>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed font-body">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-nav text-xs uppercase tracking-[0.15em] text-foreground mb-6">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {['properties', 'about', 'team', 'blog', 'careers', 'contact'].map((key) => (
                <li key={key}>
                  <Link
                    to={`/${key}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-body"
                  >
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-nav text-xs uppercase tracking-[0.15em] text-foreground mb-6">
              {t('footer.services')}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-body">
              <li>Property Sales</li>
              <li>Rental Management</li>
              <li>Valuation</li>
              <li>Investment Advisory</li>
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h4 className="font-nav text-xs uppercase tracking-[0.15em] text-foreground mb-6">
              {t('footer.contactInfo')}
            </h4>
            <address className="not-italic space-y-3 text-sm text-muted-foreground font-body mb-6">
              <p>{contactAddress}</p>
              <p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-primary transition-colors"
                >
                  {contactEmail}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="hover:text-primary transition-colors"
                >
                  {contactPhone}
                </a>
              </p>
            </address>
            {social.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                {social.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-sm bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-300"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
            <Newsletter variant="inline" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-body">
            <span>© {new Date().getFullYear()} {t('footer.rights')}</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>{companyName}</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Reg.nr: {registryCode}</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>estoria.estate</span>
            <span className="hidden sm:inline text-border">·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
          </div>

          <div className="flex items-center gap-2 font-nav text-xs uppercase">
            {languages.map((lang, i) => (
              <span key={lang} className="flex items-center">
                <button
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-1 transition-colors ${
                    i18n.language === lang ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
                {i < languages.length - 1 && <span className="text-border">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
