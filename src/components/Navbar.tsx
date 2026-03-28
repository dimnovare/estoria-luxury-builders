import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { key: 'home', path: '/' },
  { key: 'properties', path: '/properties' },
  { key: 'services', path: '/services' },
  { key: 'about', path: '/about' },
  { key: 'team', path: '/team' },
  { key: 'blog', path: '/blog' },
  { key: 'contact', path: '/contact' },
];

const languages = ['et', 'en', 'ru'] as const;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          {/* Logo */}
          <Link to="/" className="font-heading text-2xl tracking-[0.3em] text-primary font-semibold">
            ESTORIA
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ key, path }) => (
              <Link
                key={key}
                to={path}
                className={`font-nav text-xs uppercase tracking-[0.15em] relative pb-1 transition-colors duration-300 ${
                  location.pathname === path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 ${
                  location.pathname === path ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                }`}
              >
                {t(`nav.${key}`)}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 font-nav text-xs uppercase tracking-wider">
              {languages.map((lang, i) => (
                <span key={lang} className="flex items-center">
                  <button
                    onClick={() => i18n.changeLanguage(lang)}
                    className={`transition-colors duration-200 px-1 ${
                      i18n.language === lang ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                  {i < languages.length - 1 && <span className="text-border">|</span>}
                </span>
              ))}
            </div>

            <Link
              to="/contact"
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-5 py-2.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t('nav.contactUs')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-lg flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map(({ key, path }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <Link
                    to={path}
                    className={`font-nav text-lg uppercase tracking-[0.2em] transition-colors ${
                      location.pathname === path ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {t(`nav.${key}`)}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 mt-4 font-nav text-sm"
              >
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    className={`uppercase px-2 py-1 ${
                      i18n.language === lang ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
