import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { DEMO_PROPERTIES, DEMO_SERVICES, DEMO_TEAM, DEMO_BLOG } from '@/data/demoData';

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

export type ImageProcessingStatus = 'Pending' | 'Processing' | 'Done' | 'Failed';

export interface PropertyImage {
  id: string;
  /** Legacy "best available" URL — populated from mediumUrl after processing. */
  url: string;
  thumbUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  processingStatus?: ImageProcessingStatus;
  processingError?: string;
  altText?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  district?: string;
  price: number;
  currency?: string;
  transactionType: string;
  propertyType: string;
  size: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  energyClass?: string;
  coverImageUrl?: string;
  images?: PropertyImage[];
  description?: string;
  features?: string[];
  lat?: number;
  lng?: number;
  isFeatured?: boolean;
  coverThumbUrl?: string;
  coverMediumUrl?: string;
  coverLargeUrl?: string;
  agent?: {
    id?: string;
    slug?: string;
    name: string;
    role: string;
    photoUrl?: string;
    phone: string;
    email: string;
    languages?: string[];
  };
}

export interface PropertyFilter {
  type?: string;
  transaction?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

function buildParams(filter?: PropertyFilter, page?: number): Record<string, unknown> {
  const params: Record<string, unknown> = { page };
  if (!filter) return params;
  if (filter.transaction === 'buy') params.transaction = 'Sale';
  else if (filter.transaction === 'rent') params.transaction = 'Rent';
  if (filter.type) params.type = filter.type.charAt(0).toUpperCase() + filter.type.slice(1);
  if (filter.city) params.city = filter.city;
  if (filter.minPrice) params.minPrice = filter.minPrice;
  if (filter.maxPrice) params.maxPrice = filter.maxPrice;
  return params;
}

function normalise(p: Property): Property {
  const safe = asObject<Partial<Property>>(p, {});
  return {
    ...safe,
    id: safe.id ?? '',
    slug: safe.slug ?? '',
    title: safe.title ?? '',
    address: safe.address ?? '',
    city: safe.city ?? '',
    price: typeof safe.price === 'number' ? safe.price : 0,
    size: typeof safe.size === 'number' ? safe.size : 0,
    transactionType: safe.transactionType?.toLowerCase() ?? '',
    propertyType: safe.propertyType?.toLowerCase() ?? '',
    images: asArray<PropertyImage>(safe.images),
    features: asArray<string>(safe.features),
    agent: safe.agent
      ? {
          ...safe.agent,
          name: safe.agent.name ?? '',
          role: safe.agent.role ?? '',
          phone: safe.agent.phone ?? '',
          email: safe.agent.email ?? '',
          languages: asArray<string>(safe.agent.languages),
        }
      : undefined,
  };
}

export function useProperties(filter?: PropertyFilter, page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: Property[]; total: number; page: number }>({
    queryKey: ['properties', filter, page, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/properties', { params: buildParams(filter, page) });
        const items = asArray<Property>(r.data?.items).map(normalise);
        if (items.length > 0) return { data: items, total: r.data?.totalCount ?? 0, page: r.data?.page ?? page };
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) {
        let items = DEMO_PROPERTIES;
        if (filter?.transaction === 'buy') items = items.filter(p => p.transactionType === 'sale');
        else if (filter?.transaction === 'rent') items = items.filter(p => p.transactionType === 'rent');
        if (filter?.type) items = items.filter(p => p.propertyType === filter.type);
        if (filter?.city) items = items.filter(p => p.city === filter.city);
        return { data: items, total: items.length, page: 1 };
      }
      return { data: [], total: 0, page: 1 };
    },
    retry: false,
  });
}

export function useProperty(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Property | undefined>({
    queryKey: ['property', slug, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get(`/properties/${slug}`);
        return normalise(asObject<Property>(r.data, {} as Property));
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) {
        return DEMO_PROPERTIES.find(p => p.slug === slug);
      }
      return undefined;
    },
    enabled: !!slug,
    retry: false,
  });
}

export function useFeaturedProperties() {
  const { i18n } = useTranslation();
  return useQuery<Property[]>({
    queryKey: ['properties', 'featured', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/properties/featured');
        const items = asArray<Property>(r.data).map(normalise);
        if (items.length > 0) return items;
      } catch { /* fall through to demo */ }
      if (import.meta.env.DEV) {
        return DEMO_PROPERTIES.filter(p => p.isFeatured);
      }
      return [];
    },
    retry: false,
  });
}
