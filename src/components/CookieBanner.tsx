import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'estoria-cookie-consent';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) !== 'true') {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
    >
      <div className="h-px gold-gradient" />
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground font-body text-center sm:text-left">
          {t('cookies.message')}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/privacy"
            className="text-sm font-nav uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
          >
            {t('cookies.privacy')}
          </Link>
          <button
            onClick={accept}
            className="px-6 py-2 bg-primary text-primary-foreground font-nav text-xs uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
