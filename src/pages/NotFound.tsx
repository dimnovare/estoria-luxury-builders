import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-heading text-8xl text-primary font-light">404</h1>
        <p className="mt-4 text-xl text-foreground font-heading">{t('common.notFound')}</p>
        <Link
          to="/"
          className="mt-8 inline-block font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          {t('common.backHome')}
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
