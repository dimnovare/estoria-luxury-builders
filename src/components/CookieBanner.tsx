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

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('cookies.ariaLabel', 'Cookie consent')}
      className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
    >
      <div className="h-px gold-gradient" />
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground font-body text-center sm:text-left">
          {t('cookies.message')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Link
            to="/privacy"
            className="inline-flex items-center min-h-[44px] text-sm font-nav uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
          >
            {t('cookies.privacy')}
          </Link>
          <button
            onClick={decline}
            className="min-h-[44px] px-6 py-2 rounded-sm border border-border text-muted-foreground font-nav text-xs uppercase tracking-[0.15em] hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            {t('cookies.decline', 'Decline')}
          </button>
          <button
            onClick={accept}
            className="min-h-[44px] px-6 py-2 rounded-sm bg-primary text-primary-foreground font-nav text-xs uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
