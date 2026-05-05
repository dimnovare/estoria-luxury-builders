import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ArrowDownRight, ArrowUpRight, History, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { usePropertyHistory, type PropertyHistoryEvent } from '@/hooks/api/useSavedSearches';

interface Props {
  slug?: string;
}

interface PriceFields { price?: number; currency?: string }

/**
 * Public price-history widget. Collapsed by default — most properties have a
 * thin history and don't need to dominate the page. Renders one line per
 * event with a date and a localized human-readable summary.
 */
export default function PropertyHistory({ slug }: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = usePropertyHistory(open ? slug : undefined, 20);

  // Don't render the widget at all on a missing slug; keeps the parent page
  // tidy in error states.
  if (!slug) return null;

  return (
    <div className="mb-12">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full justify-between border-t border-b border-border py-4 text-left"
      >
        <span className="flex items-center gap-2 font-heading text-xl text-foreground">
          <History size={18} className="text-primary" />
          {t('properties.detail.historyTitle')}
        </span>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="pt-4">
          {isLoading && <p className="text-sm text-muted-foreground font-body">{t('common.loading')}</p>}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground font-body">{t('properties.detail.historyEmpty')}</p>
          )}
          {!isLoading && data && data.length > 0 && (
            <ul className="space-y-3">
              {data.map(ev => (
                <li
                  key={ev.id}
                  className="flex items-start gap-3 text-sm font-body text-foreground"
                >
                  <span className="text-xs text-muted-foreground font-body w-24 shrink-0 mt-0.5">
                    {format(new Date(ev.createdAt), 'dd.MM.yyyy')}
                  </span>
                  <span className="flex items-center gap-2 flex-1">
                    {renderEventDescription(ev, t, i18n.language)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function renderEventDescription(
  ev: PropertyHistoryEvent,
  t: (key: string, opts?: Record<string, unknown>) => string,
  locale: string,
) {
  switch (ev.type) {
    case 'PriceChanged': {
      const prev = parseJson<PriceFields>(ev.previousJson);
      const next = parseJson<PriceFields>(ev.newJson);
      if (prev?.price != null && next?.price != null) {
        const dropped = next.price < prev.price;
        const Icon = dropped ? ArrowDownRight : ArrowUpRight;
        return (
          <>
            <Icon size={14} className={dropped ? 'text-green-600' : 'text-amber-600'} />
            <span>
              {t(dropped ? 'properties.detail.history.priceReduced' : 'properties.detail.history.priceIncreased', {
                from: formatPrice(prev.price, prev.currency ?? 'EUR', locale),
                to:   formatPrice(next.price, next.currency ?? prev.currency ?? 'EUR', locale),
              })}
            </span>
          </>
        );
      }
      return <span>{t('properties.detail.history.priceChangedGeneric')}</span>;
    }
    case 'Featured':
      return (<><Star size={14} className="text-primary" /> <span>{t('properties.detail.history.featured')}</span></>);
    case 'Unfeatured':
      return (<><StarOff size={14} className="text-muted-foreground" /> <span>{t('properties.detail.history.unfeatured')}</span></>);
    case 'StatusChanged':
      return <span>{t('properties.detail.history.statusChanged')}</span>;
    case 'PublishedFirst':
      return <span>{t('properties.detail.history.publishedFirst')}</span>;
    case 'Created':
      return <span>{t('properties.detail.history.created')}</span>;
    default:
      return <span>{ev.type}</span>;
  }
}

function parseJson<T>(raw?: string): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function formatPrice(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}
