import { useTranslation } from 'react-i18next';
import { Phone, MessageCircle, Mail } from 'lucide-react';

interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
  /** Pre-filled WhatsApp/email message. */
  message?: string;
  /** 'solid' = gold filled buttons; 'outline' = bordered. */
  variant?: 'solid' | 'outline';
  className?: string;
}

/** Digits-only international number for tel:/wa.me (drops +, spaces, dashes). */
function digits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * Call / WhatsApp / Email quick-action buttons. Most brokerage leads come from a
 * phone, so these remove all friction. Renders only the channels that have a value.
 */
export default function ContactActions({
  phone,
  email,
  message,
  variant = 'solid',
  className = '',
}: ContactActionsProps) {
  const { t } = useTranslation();

  const base =
    'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-nav uppercase tracking-wider transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2';
  const solid = 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] hover:bg-[hsl(43_50%_48%)]';
  const outline =
    'border border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_54%)] hover:text-[hsl(0_0%_4%)]';
  const cls = `${base} ${variant === 'solid' ? solid : outline}`;

  const waText = message ? `?text=${encodeURIComponent(message)}` : '';

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {phone && (
        <a href={`tel:${phone}`} className={cls} aria-label={t('contact.call', 'Call')}>
          <Phone className="h-4 w-4" /> {t('contact.call', 'Call')}
        </a>
      )}
      {phone && (
        <a
          href={`https://wa.me/${digits(phone)}${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className={variant === 'solid' ? `${base} ${outline}` : cls}
          aria-label={t('contact.whatsapp', 'WhatsApp')}
        >
          <MessageCircle className="h-4 w-4" /> {t('contact.whatsapp', 'WhatsApp')}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}${message ? `?body=${encodeURIComponent(message)}` : ''}`}
          className={`${base} ${outline}`}
          aria-label={t('contact.email', 'Email')}
        >
          <Mail className="h-4 w-4" /> {t('contact.email', 'Email')}
        </a>
      )}
    </div>
  );
}
