import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Two-in-one scroll behavior for SPA navigation:
 * - On route change without hash: scroll to top.
 * - On route change with hash: scroll to that element when it appears
 *   (retries briefly to handle async-rendered content like CMS lists).
 * Mounts once at the top of <BrowserRouter> in App.tsx.
 */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const id = hash.replace(/^#/, '');
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      // ~1.5s of retries; covers a typical /services CMS render.
      if (++attempts < 20) {
        window.setTimeout(tryScroll, 75);
      }
    };
    tryScroll();
  }, [pathname, hash]);

  return null;
}
