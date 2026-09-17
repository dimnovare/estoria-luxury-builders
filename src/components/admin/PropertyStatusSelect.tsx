import { useTranslation } from 'react-i18next';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { propertyStatusLabel, propertyClosureReasonLabel } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

/** Statuses that keep an object on the working list vs. move it to the archive. */
export const CURRENT_STATUSES = ['Draft', 'Active', 'Passive'] as const;
export const COMPLETED_STATUSES = ['Sold', 'Rented', 'Archived'] as const;

/**
 * One muted tone per status. Deliberately desaturated — the admin is a warm,
 * cream-and-gold surface, and saturated default chips (green-100/blue-100) read
 * as generic and fight the brand. Every pair clears 4.5:1 on its own background,
 * and the label carries the meaning so colour is never the only signal.
 */
const STATUS_TONE: Record<string, { chip: string; dot: string }> = {
  Draft: {
    chip: 'bg-amber-50 text-amber-900 ring-amber-700/25 hover:bg-amber-100 focus-visible:ring-amber-700',
    dot: 'bg-amber-500',
  },
  Active: {
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-700/25 hover:bg-emerald-100 focus-visible:ring-emerald-700',
    dot: 'bg-emerald-600',
  },
  Passive: {
    chip: 'bg-slate-100 text-slate-600 ring-slate-500/25 hover:bg-slate-200 focus-visible:ring-slate-500',
    dot: 'bg-slate-400',
  },
  Sold: {
    chip: 'bg-sky-50 text-sky-800 ring-sky-700/25 hover:bg-sky-100 focus-visible:ring-sky-700',
    dot: 'bg-sky-600',
  },
  Rented: {
    chip: 'bg-violet-50 text-violet-800 ring-violet-700/25 hover:bg-violet-100 focus-visible:ring-violet-700',
    dot: 'bg-violet-600',
  },
  Archived: {
    chip: 'bg-stone-100 text-stone-600 ring-stone-500/25 hover:bg-stone-200 focus-visible:ring-stone-500',
    dot: 'bg-stone-400',
  },
};

const FALLBACK_TONE = {
  chip: 'bg-muted text-muted-foreground ring-border hover:bg-muted focus-visible:ring-ring',
  dot: 'bg-muted-foreground',
};

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', className)} />;
}

interface PropertyStatusSelectProps {
  value: string;
  /** Only meaningful for Archived (Lõpetatud); rendered as a quiet caption. */
  reason?: string | null;
  disabled?: boolean;
  onChange: (next: string) => void;
}

/**
 * The status control *is* the chip — previously a coloured badge sat inside a
 * bordered select box, which read as two nested controls and ate a fixed 170px
 * of a dense table. One pill, sized to its content, with the options split into
 * "in progress" and "completed" so the two halves of the lifecycle are obvious.
 */
export default function PropertyStatusSelect({
  value, reason, disabled, onChange,
}: PropertyStatusSelectProps) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[value] ?? FALLBACK_TONE;

  return (
    // The row itself is clickable; changing status must not navigate.
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          aria-label={t('admin.properties.table.status')}
          className={cn(
            'relative h-7 w-auto justify-start gap-1.5 rounded-full border-0 px-2.5 py-0',
            // The pill stays 28px for table density, but the clickable area is
            // extended to ~44px so it is comfortable on a touch screen.
            'after:absolute after:inset-x-0 after:-inset-y-2 after:content-[""]',
            'text-xs font-medium ring-1 ring-inset',
            'transition-colors duration-150',
            'focus:ring-0 focus:ring-offset-0',
            'focus-visible:ring-2 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-40',
            tone.chip,
          )}
        >
          <Dot className={tone.dot} />
          <SelectValue>{propertyStatusLabel(value, t)}</SelectValue>
        </SelectTrigger>

        <SelectContent align="start" className="min-w-[13rem]">
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t('admin.properties.statusGroupCurrent', 'In progress')}
            </SelectLabel>
            {CURRENT_STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <Dot className={(STATUS_TONE[s] ?? FALLBACK_TONE).dot} />
                  {propertyStatusLabel(s, t)}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t('admin.properties.statusGroupCompleted', 'Completed')}
            </SelectLabel>
            {COMPLETED_STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <Dot className={(STATUS_TONE[s] ?? FALLBACK_TONE).dot} />
                  {propertyStatusLabel(s, t)}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Tied to the chip's left edge so the reason reads as part of the status. */}
      {value === 'Archived' && reason && (
        <span className="mt-1 block pl-2.5 text-[11px] leading-tight text-muted-foreground">
          {propertyClosureReasonLabel(reason, t)}
        </span>
      )}
    </div>
  );
}
