import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { z } from 'zod';
import api from '@/lib/api';

interface Props {
  variant?: 'section' | 'inline';
}

const emailSchema = z.string().trim().email();

export default function Newsletter({ variant = 'section' }: Props) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      await api.post('/newsletter/subscribe', {
        email: parsed.data,
        language: i18n.language,
      });
      setStatus('success');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setStatus('already');
      } else {
        setStatus('error');
        setErrorMsg('Something went wrong. Please try again.');
      }
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center gap-2 ${variant === 'section' ? 'py-4' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="text-success" size={16} />
        </div>
        <span className="text-success font-body text-sm">Welcome aboard!</span>
      </motion.div>
    );
  }

  if (status === 'already') {
    return (
      <div className={`text-center ${variant === 'section' ? 'py-4' : ''}`}>
        <span className="text-muted-foreground font-body text-sm">You're already subscribed!</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            required
            className="flex-1 bg-secondary border border-border text-foreground text-sm font-body px-4 py-2.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="gold-gradient text-primary-foreground px-5 py-2.5 rounded-sm font-nav text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {status === 'loading' ? <Loader2 size={12} className="animate-spin" /> : null}
            {t('newsletter.subscribe')}
          </button>
        </div>
        {errorMsg && <p className="text-destructive text-xs font-body">{errorMsg}</p>}
      </form>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('newsletter.placeholder')}
          required
          className="flex-1 bg-secondary border border-border text-foreground text-sm font-body px-5 py-3.5 rounded-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="gold-gradient text-primary-foreground px-8 py-3.5 rounded-sm font-nav text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : null}
          {t('newsletter.subscribe')}
        </button>
      </form>
      {errorMsg && <p className="text-destructive text-xs font-body mt-2">{errorMsg}</p>}
    </div>
  );
}
