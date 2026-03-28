import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
}

export default function PagePlaceholder({ title, subtitle }: Props) {
  const { t } = useTranslation();
  return (
    <div className="pt-20 min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-12 h-px gold-gradient mx-auto mb-6" />
        <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground mb-4">{title}</h1>
        {subtitle && <p className="text-muted-foreground font-body">{subtitle}</p>}
        <p className="text-muted-foreground/50 font-body text-sm mt-8">Coming soon</p>
      </motion.div>
    </div>
  );
}
