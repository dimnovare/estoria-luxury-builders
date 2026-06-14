import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AMENITY_KEYS,
  BUILDING_MATERIAL_OPTIONS,
  CONDITION_OPTIONS,
  HEATING_TYPE_OPTIONS,
  PARKING_TYPE_OPTIONS,
  type BuildingMaterial,
  type HeatingType,
  type ParkingType,
  type PropertyCondition,
  type PropertyExtraFields,
} from '@/lib/propertyExportOptions';

interface PropertyExtraDetailsProps {
  value: PropertyExtraFields;
  onChange: (patch: Partial<PropertyExtraFields>) => void;
}

/** Radix Select can't hold an empty string value, so use a sentinel for "none". */
const NONE = '__none__';

/**
 * Grouped, collapsible "extra details" section for the Kinnisvara24 property
 * fields. Every field is optional. Subsections (condition/build, heating,
 * amenities, parking/kitchen, rental, media) are organised in an Accordion so
 * the owner sees a scannable set of headers rather than a wall of inputs.
 *
 * Self-contained: it owns no draft state — it reflects `value` and emits a
 * shallow `patch` on every edit, so the parent form remains the single source
 * of truth. The EHAK location picker and cadastral number live in the form
 * itself (wired separately); this component covers the remaining extra fields.
 */
export default function PropertyExtraDetails({ value, onChange }: PropertyExtraDetailsProps) {
  const { t } = useTranslation();
  // Stable id prefix so every label/control pair is uniquely associated even
  // when several of these components mount on one page.
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const heating = value.heatingTypes ?? [];

  const toggleHeating = (type: HeatingType, on: boolean) => {
    const next = on ? [...new Set([...heating, type])] : heating.filter((h) => h !== type);
    onChange({ heatingTypes: next });
  };

  /** Parse a number input → number | null (empty string clears the field). */
  const numOrNull = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <Accordion
      type="multiple"
      defaultValue={['condition', 'amenities']}
      className="w-full"
    >
      {/* ── Seisukord ja ehitus (Condition & build) ───────────────────────── */}
      <AccordionItem value="condition">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.condition', 'Condition & build')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={fid('condition')}>
                {t('admin.properties.extra.field.condition', 'Condition')}
              </Label>
              <Select
                value={value.condition ?? NONE}
                onValueChange={(v) =>
                  onChange({ condition: v === NONE ? null : (v as PropertyCondition) })
                }
              >
                <SelectTrigger id={fid('condition')} className="h-11">
                  <SelectValue placeholder={t('admin.properties.extra.placeholder.select', 'Select…')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {t('admin.properties.extra.placeholder.none', '— None —')}
                  </SelectItem>
                  {CONDITION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(o.labelKey, o.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={fid('material')}>
                {t('admin.properties.extra.field.buildingMaterial', 'Building material')}
              </Label>
              <Select
                value={value.buildingMaterial ?? NONE}
                onValueChange={(v) =>
                  onChange({ buildingMaterial: v === NONE ? null : (v as BuildingMaterial) })
                }
              >
                <SelectTrigger id={fid('material')} className="h-11">
                  <SelectValue placeholder={t('admin.properties.extra.placeholder.select', 'Select…')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {t('admin.properties.extra.placeholder.none', '— None —')}
                  </SelectItem>
                  {BUILDING_MATERIAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(o.labelKey, o.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Küte (Heating) — multi ────────────────────────────────────────── */}
      <AccordionItem value="heating">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.heating', 'Heating')}
        </AccordionTrigger>
        <AccordionContent>
          <fieldset className="space-y-0">
            <legend className="sr-only">
              {t('admin.properties.extra.section.heating', 'Heating')}
            </legend>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {HEATING_TYPE_OPTIONS.map((o) => {
                const id = fid(`heating-${o.value}`);
                const checked = heating.includes(o.value as HeatingType);
                return (
                  <div key={o.value} className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(c) => toggleHeating(o.value as HeatingType, c === true)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={id} className="cursor-pointer font-normal">
                      {t(o.labelKey, o.value)}
                    </Label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </AccordionContent>
      </AccordionItem>

      {/* ── Mugavused (Amenities) — 10 booleans, 2-col grid ───────────────── */}
      <AccordionItem value="amenities">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.amenities', 'Amenities')}
        </AccordionTrigger>
        <AccordionContent>
          <fieldset className="space-y-0">
            <legend className="sr-only">
              {t('admin.properties.extra.section.amenities', 'Amenities')}
            </legend>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {AMENITY_KEYS.map((a) => {
                const id = fid(`amenity-${a.key}`);
                const checked = value[a.key] === true;
                return (
                  <div key={a.key} className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(c) => onChange({ [a.key]: c === true })}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={id} className="cursor-pointer font-normal">
                      {t(a.labelKey, a.key)}
                    </Label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </AccordionContent>
      </AccordionItem>

      {/* ── Parkimine ja köök (Parking & kitchen) ─────────────────────────── */}
      <AccordionItem value="parking">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.parking', 'Parking & kitchen')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={fid('parking')}>
                {t('admin.properties.extra.field.parkingType', 'Parking')}
              </Label>
              <Select
                value={value.parkingType ?? NONE}
                onValueChange={(v) =>
                  onChange({ parkingType: v === NONE ? null : (v as ParkingType) })
                }
              >
                <SelectTrigger id={fid('parking')} className="h-11">
                  <SelectValue placeholder={t('admin.properties.extra.placeholder.select', 'Select…')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {t('admin.properties.extra.placeholder.none', '— None —')}
                  </SelectItem>
                  {PARKING_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(o.labelKey, o.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={fid('kitchenArea')}>
                {t('admin.properties.extra.field.kitchenArea', 'Kitchen area (m²)')}
              </Label>
              <Input
                id={fid('kitchenArea')}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                className="h-11"
                value={value.kitchenArea ?? ''}
                onChange={(e) => onChange({ kitchenArea: numOrNull(e.target.value) })}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Rendiandmed (Rental) ──────────────────────────────────────────── */}
      <AccordionItem value="rental">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.rental', 'Rental')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={fid('deposit')}>
                {t('admin.properties.extra.field.deposit', 'Deposit (€)')}
              </Label>
              <Input
                id={fid('deposit')}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                className="h-11"
                value={value.deposit ?? ''}
                onChange={(e) => onChange({ deposit: numOrNull(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={fid('utilSummer')}>
                {t('admin.properties.extra.field.utilityCostSummer', 'Utilities — summer (€)')}
              </Label>
              <Input
                id={fid('utilSummer')}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                className="h-11"
                value={value.utilityCostSummer ?? ''}
                onChange={(e) => onChange({ utilityCostSummer: numOrNull(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={fid('utilWinter')}>
                {t('admin.properties.extra.field.utilityCostWinter', 'Utilities — winter (€)')}
              </Label>
              <Input
                id={fid('utilWinter')}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                className="h-11"
                value={value.utilityCostWinter ?? ''}
                onChange={(e) => onChange({ utilityCostWinter: numOrNull(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-input px-3">
            <Label htmlFor={fid('pets')} className="cursor-pointer font-normal">
              {t('admin.properties.extra.field.petsAllowed', 'Pets allowed')}
            </Label>
            <Switch
              id={fid('pets')}
              checked={value.petsAllowed === true}
              onCheckedChange={(c) => onChange({ petsAllowed: c })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Meedia (Media) ────────────────────────────────────────────────── */}
      <AccordionItem value="media">
        <AccordionTrigger className="text-sm">
          {t('admin.properties.extra.section.media', 'Media')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={fid('videoUrl')}>
              {t('admin.properties.extra.field.videoUrl', 'Video URL')}
            </Label>
            <Input
              id={fid('videoUrl')}
              type="url"
              inputMode="url"
              placeholder="https://"
              className="h-11"
              value={value.videoUrl ?? ''}
              onChange={(e) => onChange({ videoUrl: e.target.value.trim() === '' ? null : e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={fid('tourUrl')}>
              {t('admin.properties.extra.field.virtualTourUrl', 'Virtual tour URL')}
            </Label>
            <Input
              id={fid('tourUrl')}
              type="url"
              inputMode="url"
              placeholder="https://"
              className="h-11"
              value={value.virtualTourUrl ?? ''}
              onChange={(e) =>
                onChange({ virtualTourUrl: e.target.value.trim() === '' ? null : e.target.value })
              }
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
