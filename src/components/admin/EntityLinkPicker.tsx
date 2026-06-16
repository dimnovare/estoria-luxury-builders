import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useContacts, useDeals, type CrmContact, type DealListDto } from '@/hooks/api/useCrm';
import { useProperties, type Property } from '@/hooks/api/useProperties';
import { useAdminUsers, type AdminUser } from '@/hooks/api/useAdminUsers';
import { useCompanies, type CompanyListDto } from '@/hooks/api/useRelationships';

export type EntityLinkType = 'contact' | 'property' | 'deal' | 'user' | 'company';

interface EntityLinkPickerProps {
  type: EntityLinkType;
  /** Currently-linked entity id (GUID). */
  value?: string | null;
  /** Fires with the chosen id (or null when cleared) plus its resolved label. */
  onChange: (id: string | null, label?: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/** Normalised option the combobox renders, regardless of source entity shape. */
interface EntityOption {
  id: string;
  label: string;
  /** Optional secondary line (email, address, …) shown muted under the label. */
  sublabel?: string;
}

/**
 * Loads the right list-fetching hook for the given entity `type` and maps the
 * heterogeneous DTOs onto a flat { id, label, sublabel } option shape.
 *
 * All four supported hooks are always called (React's rules-of-hooks forbid
 * conditional hook calls), but each query is gated with `enabled` so only the
 * one matching `type` actually hits the network.
 *
 * NOTE: every requested type currently has a backing hook. If a future `type`
 * has no available hook, `options` resolves to `undefined` and the component
 * falls back to a plain text input (see render below) so the field still works
 * by pasting a raw id.
 */
function useEntityOptions(type: EntityLinkType): {
  options: EntityOption[] | undefined;
  isLoading: boolean;
} {
  // Contacts — { items, totalCount }, human field = fullName.
  const contacts = useContacts(type === 'contact' ? { pageSize: 100 } : undefined);
  // Properties — { data, total, page }, human field = title.
  const properties = useProperties(undefined, 1);
  // Deals — kanban-grouped Record<stage, DealListDto[]>, human field = title.
  const deals = useDeals(type === 'deal' ? {} : undefined);
  // Users — { items, totalCount }, human field = fullName.
  const users = useAdminUsers(1, '');
  // Companies — { items, totalCount, … }, human field = name.
  const companies = useCompanies(type === 'company' ? { pageSize: 100 } : undefined);

  return useMemo(() => {
    switch (type) {
      case 'contact': {
        const items = (contacts.data?.items ?? []) as CrmContact[];
        return {
          isLoading: contacts.isLoading,
          options: items.map((c) => ({
            id: c.id,
            label: c.fullName,
            sublabel: c.email || c.phone || c.company,
          })),
        };
      }
      case 'property': {
        const items = (properties.data?.data ?? []) as Property[];
        return {
          isLoading: properties.isLoading,
          options: items.map((p) => ({
            id: p.id,
            label: p.title,
            sublabel: [p.address, p.city].filter(Boolean).join(', ') || undefined,
          })),
        };
      }
      case 'deal': {
        // Flatten the kanban groups (Record<stage, DealListDto[]>) into one list.
        const groups = (deals.data ?? {}) as Record<string, DealListDto[]>;
        const items = Object.values(groups).flat();
        return {
          isLoading: deals.isLoading,
          options: items.map((d) => ({
            id: d.id,
            label: d.title,
            sublabel: d.primaryContactName || d.stage,
          })),
        };
      }
      case 'user': {
        const items = (users.data?.items ?? []) as AdminUser[];
        return {
          isLoading: users.isLoading,
          options: items.map((u) => ({
            id: u.id,
            label: u.fullName,
            sublabel: u.email,
          })),
        };
      }
      case 'company': {
        const items = (companies.data?.items ?? []) as CompanyListDto[];
        return {
          isLoading: companies.isLoading,
          options: items.map((c) => ({
            id: c.id,
            label: c.name,
            sublabel: c.registryCode || c.email,
          })),
        };
      }
      default:
        // Unsupported type — no hook available. Signal the plain-input fallback.
        return { options: undefined, isLoading: false };
    }
  }, [type, contacts.data, contacts.isLoading, properties.data, properties.isLoading, deals.data, deals.isLoading, users.data, users.isLoading, companies.data, companies.isLoading]);
}

/**
 * Search-autocomplete for linking a record to another entity (contact /
 * property / deal / user) without pasting a raw GUID — built for non-technical
 * owners. Resolves the currently-selected id back to a human label from the
 * loaded list, filters by typed text on the display field, and exposes a clear
 * (X) button.
 */
export default function EntityLinkPicker({
  type,
  value,
  onChange,
  label,
  placeholder,
  className,
}: EntityLinkPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { options, isLoading } = useEntityOptions(type);

  // Resolve the selected id back to its human label from the loaded list.
  const selected = useMemo(
    () => options?.find((o) => o.id === value) ?? null,
    [options, value],
  );

  const searchPlaceholder =
    placeholder ?? t('admin.entityPicker.search', { defaultValue: 'Search…' });
  const emptyText = t('admin.entityPicker.empty', { defaultValue: 'No results' });
  const loadingText = t('admin.entityPicker.loading', { defaultValue: 'Loading…' });
  // Shown when an id is set but the matching record isn't in the loaded list
  // (e.g. linked record outside the first page, or since-deleted).
  const unknownLabel = t('admin.entityPicker.unknown', { defaultValue: 'Selected (not in list)' });

  // ── Plain-input fallback for any type without a backing hook ─────────────────
  if (options === undefined) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <Label htmlFor={`entity-link-${type}`}>{label}</Label>}
        <Input
          id={`entity-link-${type}`}
          value={value ?? ''}
          placeholder={searchPlaceholder}
          className="h-11"
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange(v ? v : null);
          }}
        />
      </div>
    );
  }

  const triggerText = selected
    ? selected.label
    : value
      ? unknownLabel
      : searchPlaceholder;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label id={`entity-link-label-${type}`} htmlFor={`entity-link-${type}`}>
          {label}
        </Label>
      )}

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={`entity-link-${type}`}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby={label ? `entity-link-label-${type}` : undefined}
              // 44px touch target, full-width, text aligned left like an input.
              className="h-11 w-full justify-between font-normal"
            >
              <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                {triggerText}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            {/*
              cmdk filters items by their `value` prop against the typed text.
              We feed it "label sublabel" so a match on either line surfaces the
              item — matching the "filter by typed text on the display field"
              behaviour while still letting owners search by email/address.
            */}
            <Command>
              <CommandInput placeholder={searchPlaceholder} className="h-11" />
              <CommandList>
                <CommandEmpty>{isLoading ? loadingText : emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.id}
                      value={`${opt.label} ${opt.sublabel ?? ''} ${opt.id}`}
                      // 44px row for comfortable touch targets.
                      className="min-h-[44px] cursor-pointer"
                      onSelect={() => {
                        onChange(opt.id, opt.label);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === opt.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="truncate text-xs text-muted-foreground">
                            {opt.sublabel}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            // 44px clear target, keyboard-reachable.
            className="h-11 w-11 shrink-0"
            aria-label={t('admin.entityPicker.clear', { defaultValue: 'Clear selection' })}
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
