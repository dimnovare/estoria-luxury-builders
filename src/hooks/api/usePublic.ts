import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface PublicStats {
  propertiesActive: number;
  successfulDeals: number;
  yearsExperience: number;
  satisfactionPercent: number;
  languages: string[];
}

export interface CityDto {
  name: string;
  count: number;
}

export interface PropertyTypeOption {
  value: string;
  label: string;
}

export interface PropertyTypeOptionsDto {
  propertyTypes: PropertyTypeOption[];
  transactionTypes: PropertyTypeOption[];
}

// -----------------------------------------------------------------------------
// Demo fallbacks (DEV only) — mirror the values that were hardcoded before so
// offline dev keeps working.
// -----------------------------------------------------------------------------

const DEMO_STATS: PublicStats = {
  propertiesActive: 120,
  successfulDeals: 0,
  yearsExperience: 8,
  satisfactionPercent: 98,
  languages: ['et', 'en', 'ru'],
};

const DEMO_CITIES: CityDto[] = [
  { name: 'Tallinn', count: 0 },
  { name: 'Tartu', count: 0 },
  { name: 'Pärnu', count: 0 },
];

const DEMO_TYPE_OPTIONS_BY_LANG: Record<string, PropertyTypeOptionsDto> = {
  en: {
    propertyTypes: [
      { value: 'Apartment',  label: 'Apartment'  },
      { value: 'House',      label: 'House'      },
      { value: 'Commercial', label: 'Commercial' },
      { value: 'Land',       label: 'Land'       },
      { value: 'Office',     label: 'Office'     },
    ],
    transactionTypes: [
      { value: 'Sale', label: 'For Sale' },
      { value: 'Rent', label: 'For Rent' },
    ],
  },
  et: {
    propertyTypes: [
      { value: 'Apartment',  label: 'Korter'   },
      { value: 'House',      label: 'Maja'     },
      { value: 'Commercial', label: 'Äripind'  },
      { value: 'Land',       label: 'Maa'      },
      { value: 'Office',     label: 'Kontor'   },
    ],
    transactionTypes: [
      { value: 'Sale', label: 'Müük' },
      { value: 'Rent', label: 'Üür'  },
    ],
  },
  ru: {
    propertyTypes: [
      { value: 'Apartment',  label: 'Квартира'     },
      { value: 'House',      label: 'Дом'          },
      { value: 'Commercial', label: 'Коммерческая' },
      { value: 'Land',       label: 'Земля'        },
      { value: 'Office',     label: 'Офис'         },
    ],
    transactionTypes: [
      { value: 'Sale', label: 'Продажа' },
      { value: 'Rent', label: 'Аренда'  },
    ],
  },
};

// -----------------------------------------------------------------------------
// Normalisers
// -----------------------------------------------------------------------------

const normaliseStats = (raw: unknown): PublicStats => {
  const safe = asObject<Partial<PublicStats>>(raw, {});
  return {
    propertiesActive:    typeof safe.propertiesActive    === 'number' ? safe.propertiesActive    : 0,
    successfulDeals:     typeof safe.successfulDeals     === 'number' ? safe.successfulDeals     : 0,
    yearsExperience:     typeof safe.yearsExperience     === 'number' ? safe.yearsExperience     : 0,
    satisfactionPercent: typeof safe.satisfactionPercent === 'number' ? safe.satisfactionPercent : 0,
    languages:           asArray<string>(safe.languages),
  };
};

const normaliseCity = (raw: unknown): CityDto => {
  const safe = asObject<Partial<CityDto>>(raw, {});
  return {
    name:  safe.name ?? '',
    count: typeof safe.count === 'number' ? safe.count : 0,
  };
};

const normaliseTypeOption = (raw: unknown): PropertyTypeOption => {
  const safe = asObject<Partial<PropertyTypeOption>>(raw, {});
  return {
    value: safe.value ?? '',
    label: safe.label ?? safe.value ?? '',
  };
};

const normaliseTypeOptions = (raw: unknown): PropertyTypeOptionsDto => {
  const safe = asObject<Partial<PropertyTypeOptionsDto>>(raw, {});
  return {
    propertyTypes:    asArray<unknown>(safe.propertyTypes).map(normaliseTypeOption),
    transactionTypes: asArray<unknown>(safe.transactionTypes).map(normaliseTypeOption),
  };
};

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

export function usePublicStats() {
  const { i18n } = useTranslation();
  return useQuery<PublicStats>({
    queryKey: ['public', 'stats', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/public/stats');
        return normaliseStats(r.data);
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) return DEMO_STATS;
      return normaliseStats({});
    },
    retry: false,
  });
}

export function usePublicCities() {
  const { i18n } = useTranslation();
  return useQuery<CityDto[]>({
    queryKey: ['public', 'cities', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/public/cities');
        return asArray<unknown>(r.data).map(normaliseCity);
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) return DEMO_CITIES;
      return [];
    },
    retry: false,
  });
}

export function usePropertyTypeOptions() {
  const { i18n } = useTranslation();
  return useQuery<PropertyTypeOptionsDto>({
    queryKey: ['public', 'property-types', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/public/property-types');
        return normaliseTypeOptions(r.data);
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) {
        return DEMO_TYPE_OPTIONS_BY_LANG[i18n.language] ?? DEMO_TYPE_OPTIONS_BY_LANG.en;
      }
      return { propertyTypes: [], transactionTypes: [] };
    },
    retry: false,
  });
}
