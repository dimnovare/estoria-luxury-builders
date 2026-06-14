/**
 * Option constants + types for the Kinnisvara24 "extra details" property fields.
 *
 * These mirror the backend export contract (camelCase enum values) so the admin
 * dropdowns/checkboxes emit exactly what the API persists and the
 * Kinnisvara24 XML adapter maps. The string `value`s are the wire format; the
 * `labelKey`s are i18next keys (admin.properties.extra.*) consumed by the UI
 * with an inline English fallback at the call site.
 *
 * Keep this file free of React / UI imports — it is a pure contract module that
 * both the picker components and (later) the form wiring import.
 */

/** A single selectable option: backend `value` + its i18n `labelKey`. */
export interface PropertyExportOption<T extends string = string> {
  /** camelCase wire value sent to / received from the backend. */
  value: T;
  /** i18next key; render with an English fallback, e.g. t(labelKey, 'New'). */
  labelKey: string;
}

// ── Condition ────────────────────────────────────────────────────────────────

export type PropertyCondition =
  | 'New'
  | 'Renovated'
  | 'Good'
  | 'Average'
  | 'NeedsRefresh'
  | 'NeedsCapitalRepair'
  | 'InProgress';

export const CONDITION_OPTIONS: PropertyExportOption<PropertyCondition>[] = [
  { value: 'New', labelKey: 'admin.properties.extra.condition.New' },
  { value: 'Renovated', labelKey: 'admin.properties.extra.condition.Renovated' },
  { value: 'Good', labelKey: 'admin.properties.extra.condition.Good' },
  { value: 'Average', labelKey: 'admin.properties.extra.condition.Average' },
  { value: 'NeedsRefresh', labelKey: 'admin.properties.extra.condition.NeedsRefresh' },
  { value: 'NeedsCapitalRepair', labelKey: 'admin.properties.extra.condition.NeedsCapitalRepair' },
  { value: 'InProgress', labelKey: 'admin.properties.extra.condition.InProgress' },
];

// ── Building material ────────────────────────────────────────────────────────

export type BuildingMaterial = 'Stone' | 'Wood' | 'Panel' | 'Log' | 'Concrete' | 'Brick';

export const BUILDING_MATERIAL_OPTIONS: PropertyExportOption<BuildingMaterial>[] = [
  { value: 'Stone', labelKey: 'admin.properties.extra.material.Stone' },
  { value: 'Wood', labelKey: 'admin.properties.extra.material.Wood' },
  { value: 'Panel', labelKey: 'admin.properties.extra.material.Panel' },
  { value: 'Log', labelKey: 'admin.properties.extra.material.Log' },
  { value: 'Concrete', labelKey: 'admin.properties.extra.material.Concrete' },
  { value: 'Brick', labelKey: 'admin.properties.extra.material.Brick' },
];

// ── Heating (multi-select) ───────────────────────────────────────────────────

export type HeatingType =
  | 'Central'
  | 'AirHeatPump'
  | 'Electric'
  | 'Gas'
  | 'Geothermal'
  | 'Floor'
  | 'Furnace'
  | 'SolidFuel'
  | 'Combined';

export const HEATING_TYPE_OPTIONS: PropertyExportOption<HeatingType>[] = [
  { value: 'Central', labelKey: 'admin.properties.extra.heating.Central' },
  { value: 'AirHeatPump', labelKey: 'admin.properties.extra.heating.AirHeatPump' },
  { value: 'Electric', labelKey: 'admin.properties.extra.heating.Electric' },
  { value: 'Gas', labelKey: 'admin.properties.extra.heating.Gas' },
  { value: 'Geothermal', labelKey: 'admin.properties.extra.heating.Geothermal' },
  { value: 'Floor', labelKey: 'admin.properties.extra.heating.Floor' },
  { value: 'Furnace', labelKey: 'admin.properties.extra.heating.Furnace' },
  { value: 'SolidFuel', labelKey: 'admin.properties.extra.heating.SolidFuel' },
  { value: 'Combined', labelKey: 'admin.properties.extra.heating.Combined' },
];

// ── Parking ──────────────────────────────────────────────────────────────────

export type ParkingType = 'Street' | 'Underground' | 'Yard' | 'Garage';

export const PARKING_TYPE_OPTIONS: PropertyExportOption<ParkingType>[] = [
  { value: 'Street', labelKey: 'admin.properties.extra.parking.Street' },
  { value: 'Underground', labelKey: 'admin.properties.extra.parking.Underground' },
  { value: 'Yard', labelKey: 'admin.properties.extra.parking.Yard' },
  { value: 'Garage', labelKey: 'admin.properties.extra.parking.Garage' },
];

// ── Amenities (boolean flags) ────────────────────────────────────────────────

/** The 10 amenity boolean field names, in display order. */
export type AmenityKey =
  | 'hasSauna'
  | 'hasStoreroom'
  | 'hasBasement'
  | 'hasGarage'
  | 'hasBalcony'
  | 'hasTerrace'
  | 'hasElevator'
  | 'isFurnished'
  | 'hasAirConditioning'
  | 'hasFireplace';

/** Amenity descriptor: the field `key` (also the wire field) + its i18n label. */
export interface AmenityOption {
  key: AmenityKey;
  labelKey: string;
}

export const AMENITY_KEYS: AmenityOption[] = [
  { key: 'hasSauna', labelKey: 'admin.properties.extra.amenity.hasSauna' },
  { key: 'hasStoreroom', labelKey: 'admin.properties.extra.amenity.hasStoreroom' },
  { key: 'hasBasement', labelKey: 'admin.properties.extra.amenity.hasBasement' },
  { key: 'hasGarage', labelKey: 'admin.properties.extra.amenity.hasGarage' },
  { key: 'hasBalcony', labelKey: 'admin.properties.extra.amenity.hasBalcony' },
  { key: 'hasTerrace', labelKey: 'admin.properties.extra.amenity.hasTerrace' },
  { key: 'hasElevator', labelKey: 'admin.properties.extra.amenity.hasElevator' },
  { key: 'isFurnished', labelKey: 'admin.properties.extra.amenity.isFurnished' },
  { key: 'hasAirConditioning', labelKey: 'admin.properties.extra.amenity.hasAirConditioning' },
  { key: 'hasFireplace', labelKey: 'admin.properties.extra.amenity.hasFireplace' },
];

// ── Aggregate field shape ────────────────────────────────────────────────────

/**
 * The full set of optional Kinnisvara24 "extra detail" fields a property can
 * carry. Every field is optional/nullable — the admin only fills what's known.
 * Field names are camelCase to match the backend JSON contract exactly.
 */
export interface PropertyExtraFields {
  /** EHAK location code (settlement code if an area is chosen, else municipality). */
  ehakCode?: string | null;
  /** Cadastral (katastritunnus) number. */
  cadastralNumber?: string | null;

  condition?: PropertyCondition | null;
  buildingMaterial?: BuildingMaterial | null;
  /** Multi-select; empty array when none chosen. */
  heatingTypes?: HeatingType[];
  parkingType?: ParkingType | null;

  // Amenity booleans (the 10 AmenityKey flags).
  hasSauna?: boolean | null;
  hasStoreroom?: boolean | null;
  hasBasement?: boolean | null;
  hasGarage?: boolean | null;
  hasBalcony?: boolean | null;
  hasTerrace?: boolean | null;
  hasElevator?: boolean | null;
  isFurnished?: boolean | null;
  hasAirConditioning?: boolean | null;
  hasFireplace?: boolean | null;

  /** Kitchen area in m². */
  kitchenArea?: number | null;

  // Rental data (euros).
  deposit?: number | null;
  utilityCostSummer?: number | null;
  utilityCostWinter?: number | null;
  petsAllowed?: boolean | null;

  // Media.
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
}
