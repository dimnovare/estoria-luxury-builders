import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
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

// ── EHAK data shape (matches src/data/ehak.json) ─────────────────────────────

interface EhakCounty {
  code: string;
  name: string;
}
interface EhakMunicipality {
  code: string;
  name: string;
  countyCode: string;
  county: string;
}
interface EhakSettlement {
  code: string;
  name: string;
  kind: string;
  muniCode: string;
  muni: string;
  county: string;
}
interface EhakData {
  counties: EhakCounty[];
  municipalities: EhakMunicipality[];
  settlements: EhakSettlement[];
}

export interface EhakSelection {
  /** Settlement code when an area is chosen, otherwise the municipality code. */
  ehakCode: string;
  municipality: string;
  area: string | null;
  county: string;
}

interface EhakLocationPickerProps {
  /** Initial EHAK code — may be a municipality OR a settlement code. */
  ehakCode?: string | null;
  onChange: (sel: EhakSelection | null) => void;
  className?: string;
}

/**
 * Only render matches once the user has typed at least this many characters.
 * The settlements list is 4711 items — rendering it unfiltered would jank the
 * popover. Below the threshold we show a "type to search" hint instead.
 */
const MIN_SEARCH_CHARS = 2;
/** Hard cap on rendered rows so even a 1-char-loose query stays light. */
const MAX_RENDERED = 50;

/** Lowercase + strip diacritics so "voru" matches "Võru". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Searchable Estonian-location picker built on EHAK codes. Two stacked
 * comboboxes: municipality (Omavalitsus) over the 79 municipalities, then an
 * optional area (Piirkond / asula) over settlements within the chosen
 * municipality. The emitted `ehakCode` is the settlement code when an area is
 * picked, else the municipality code — so a property in e.g. Viimsi vald (a
 * municipality, not a city) maps correctly.
 *
 * The ~575KB ehak.json is lazy-loaded via dynamic import() inside an effect so
 * it never enters the public bundle.
 */
export default function EhakLocationPicker({
  ehakCode,
  onChange,
  className,
}: EhakLocationPickerProps) {
  const { t } = useTranslation();

  const [data, setData] = useState<EhakData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [muniOpen, setMuniOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [muniQuery, setMuniQuery] = useState('');
  const [areaQuery, setAreaQuery] = useState('');

  // Selected codes held locally; the resolved selection is reported via onChange.
  const [muniCode, setMuniCode] = useState<string | null>(null);
  const [settlementCode, setSettlementCode] = useState<string | null>(null);

  // ── Lazy-load the EHAK dataset ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    import('@/data/ehak.json')
      .then((mod) => {
        if (!cancelled) setData((mod.default ?? mod) as EhakData);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Resolve the initial ehakCode prop against both lists (once data loads) ──
  // We search settlements first (more specific), then municipalities.
  useEffect(() => {
    if (!data || !ehakCode) return;
    const settlement = data.settlements.find((s) => s.code === ehakCode);
    if (settlement) {
      setMuniCode(settlement.muniCode);
      setSettlementCode(settlement.code);
      return;
    }
    const muni = data.municipalities.find((m) => m.code === ehakCode);
    if (muni) {
      setMuniCode(muni.code);
      setSettlementCode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ehakCode]);

  const selectedMuni = useMemo(
    () => data?.municipalities.find((m) => m.code === muniCode) ?? null,
    [data, muniCode],
  );
  const selectedSettlement = useMemo(
    () => data?.settlements.find((s) => s.code === settlementCode) ?? null,
    [data, settlementCode],
  );

  // ── Emit the resolved selection upward whenever it changes ─────────────────
  function emit(nextMuni: EhakMunicipality | null, nextSettlement: EhakSettlement | null) {
    if (!nextMuni) {
      onChange(null);
      return;
    }
    onChange({
      ehakCode: nextSettlement ? nextSettlement.code : nextMuni.code,
      municipality: nextMuni.name,
      area: nextSettlement ? nextSettlement.name : null,
      county: nextMuni.county,
    });
  }

  // ── Municipality options (all 79; small enough to filter live) ─────────────
  const muniMatches = useMemo(() => {
    if (!data) return [];
    const q = normalize(muniQuery.trim());
    const list = q
      ? data.municipalities.filter(
          (m) => normalize(m.name).includes(q) || normalize(m.county).includes(q),
        )
      : data.municipalities;
    return list.slice(0, 200); // 79 total, but keep a defensive cap.
  }, [data, muniQuery]);

  // ── Area options: settlements within the chosen municipality ───────────────
  // 4711 settlements total — gate rendering behind a ≥2-char query so the list
  // stays light, and cap the rendered count.
  const muniSettlements = useMemo(() => {
    if (!data || !muniCode) return [];
    return data.settlements.filter((s) => s.muniCode === muniCode);
  }, [data, muniCode]);

  const areaQueryTrimmed = areaQuery.trim();
  const areaSearchActive = areaQueryTrimmed.length >= MIN_SEARCH_CHARS;
  const areaMatches = useMemo(() => {
    if (!areaSearchActive) return [];
    const q = normalize(areaQueryTrimmed);
    return muniSettlements
      .filter((s) => normalize(s.name).includes(q) || normalize(s.kind).includes(q))
      .slice(0, MAX_RENDERED);
  }, [muniSettlements, areaQueryTrimmed, areaSearchActive]);

  // ── Selection handlers ─────────────────────────────────────────────────────
  function handlePickMuni(m: EhakMunicipality) {
    setMuniCode(m.code);
    // Changing municipality invalidates any previously-chosen settlement.
    setSettlementCode(null);
    setAreaQuery('');
    setMuniOpen(false);
    emit(m, null);
  }

  function handlePickSettlement(s: EhakSettlement | null) {
    setSettlementCode(s ? s.code : null);
    setAreaOpen(false);
    emit(selectedMuni, s);
  }

  // ── Labels (i18n with English fallbacks) ───────────────────────────────────
  const muniLabel = t('admin.properties.extra.location.municipality', 'Municipality');
  const areaLabel = t('admin.properties.extra.location.area', 'Area / settlement');
  const muniPlaceholder = t('admin.properties.extra.location.muniPlaceholder', 'Select municipality…');
  const areaPlaceholder = t('admin.properties.extra.location.areaPlaceholder', 'Select area (optional)…');
  const searchPlaceholder = t('admin.properties.extra.location.search', 'Type to search…');
  const typeToSearch = t('admin.properties.extra.location.typeToSearch', 'Type at least 2 characters to search…');
  const emptyText = t('admin.properties.extra.location.empty', 'No matches');
  const noAreaOption = t('admin.properties.extra.location.noArea', 'No specific area');

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className={cn('text-sm text-destructive', className)} role="alert">
        {t('admin.properties.extra.location.loadError', 'Could not load location data.')}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t('admin.properties.extra.location.loading', 'Loading locations…')}
      </div>
    );
  }

  const muniTriggerText = selectedMuni
    ? `${selectedMuni.name} (${selectedMuni.county})`
    : muniPlaceholder;
  const areaTriggerText = selectedSettlement
    ? `${selectedSettlement.name} (${selectedSettlement.kind})`
    : areaPlaceholder;

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Municipality (Omavalitsus) ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label id="ehak-muni-label" htmlFor="ehak-muni">
          {muniLabel}
        </Label>
        <Popover open={muniOpen} onOpenChange={setMuniOpen}>
          <PopoverTrigger asChild>
            <Button
              id="ehak-muni"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={muniOpen}
              aria-labelledby="ehak-muni-label"
              className="h-11 w-full justify-between font-normal"
            >
              <span className={cn('truncate', !selectedMuni && 'text-muted-foreground')}>
                {muniTriggerText}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-11"
                value={muniQuery}
                onValueChange={setMuniQuery}
              />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {muniMatches.map((m) => (
                    <CommandItem
                      key={m.code}
                      value={m.code}
                      className="min-h-[44px] cursor-pointer"
                      onSelect={() => handlePickMuni(m)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          muniCode === m.code ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{m.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{m.county}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Area / settlement (Piirkond / asula) — optional ─────────────────── */}
      <div className="space-y-1.5">
        <Label id="ehak-area-label" htmlFor="ehak-area">
          {areaLabel}
        </Label>
        <Popover open={areaOpen} onOpenChange={setAreaOpen}>
          <PopoverTrigger asChild>
            <Button
              id="ehak-area"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={areaOpen}
              aria-labelledby="ehak-area-label"
              disabled={!selectedMuni}
              className="h-11 w-full justify-between font-normal"
            >
              <span className={cn('truncate', !selectedSettlement && 'text-muted-foreground')}>
                {areaTriggerText}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-11"
                value={areaQuery}
                onValueChange={setAreaQuery}
              />
              <CommandList>
                {/* Clear-area option is always available so an area can be unset. */}
                <CommandGroup>
                  <CommandItem
                    value="__no_area__"
                    className="min-h-[44px] cursor-pointer text-muted-foreground"
                    onSelect={() => handlePickSettlement(null)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        !settlementCode ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {noAreaOption}
                  </CommandItem>
                </CommandGroup>

                {areaSearchActive ? (
                  <>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {areaMatches.map((s) => (
                        <CommandItem
                          key={s.code}
                          value={s.code}
                          className="min-h-[44px] cursor-pointer"
                          onSelect={() => handlePickSettlement(s)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              settlementCode === s.code ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{s.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{s.kind}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {typeToSearch}
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
