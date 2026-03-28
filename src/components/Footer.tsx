import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const languages = ['et', 'en', 'ru'] as const;

export default function Footer() {
  const { t, i18n } = useTranslation();

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
              {['properties', 'about', 'team', 'blog', 'careers'].map((key) => (
                <li key={key}>
                  <Link
                    to={`/${key}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-body"
                  >
                    {t(`nav.${key === 'careers' ? 'contact' : key}`)}
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

          {/* Contact */}
          <div>
            <h4 className="font-nav text-xs uppercase tracking-[0.15em] text-foreground mb-6">
              {t('footer.contactInfo')}
            </h4>
            <address className="not-italic space-y-3 text-sm text-muted-foreground font-body">
              <p>{t('footer.address')}</p>
              <p>info@estoria.ee</p>
              <p>+372 600 0000</p>
            </address>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} ESTORIA. {t('footer.rights')}
          </p>

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
