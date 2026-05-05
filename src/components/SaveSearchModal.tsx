import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateSavedSearch,
  type SavedSearchFilter,
  type SavedSearchFrequency,
} from '@/hooks/api/useSavedSearches';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Filter snapshot from the parent (Properties page) at the moment the modal opens. */
  filter: SavedSearchFilter;
}

/**
 * Anonymous "save this search" modal. Posts the current filter + email +
 * frequency to /api/saved-searches; the server sends a confirmation email
 * with an unsubscribe link, so we don't need an account flow here.
 */
export default function SaveSearchModal({ open, onClose, filter }: Props) {
  const { t, i18n } = useTranslation();
  const create = useCreateSavedSearch();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<SavedSearchFrequency>('Daily');

  if (!open) return null;

  const lang = i18n.language === 'et' ? 'Et' : i18n.language === 'ru' ? 'Ru' : 'En';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await create.mutateAsync({
        email: email.trim(),
        name: name.trim() || undefined,
        preferredLanguage: lang,
        filter,
        frequency,
      });
      toast.success(t('savedSearch.toast.created'));
      setEmail('');
      setName('');
      onClose();
    } catch {
      toast.error(t('savedSearch.toast.failed'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-sm w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-foreground">
            {t('savedSearch.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-5">
          {t('savedSearch.description')}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-nav uppercase tracking-wider text-muted-foreground mb-1.5">
              {t('savedSearch.fields.email')} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-nav uppercase tracking-wider text-muted-foreground mb-1.5">
              {t('savedSearch.fields.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder={t('savedSearch.fields.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-nav uppercase tracking-wider text-muted-foreground mb-1.5">
              {t('savedSearch.fields.frequency')}
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as SavedSearchFrequency)}
              className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="Instant">{t('savedSearch.frequency.Instant')}</option>
              <option value="Daily">{t('savedSearch.frequency.Daily')}</option>
              <option value="Weekly">{t('savedSearch.frequency.Weekly')}</option>
            </select>
          </div>

          <p className="text-[11px] text-muted-foreground font-body">
            {t('savedSearch.privacyNote')}
          </p>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-nav uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="gold-gradient text-primary-foreground px-5 py-2 rounded-sm font-nav text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {create.isPending ? t('common.saving') : t('savedSearch.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
