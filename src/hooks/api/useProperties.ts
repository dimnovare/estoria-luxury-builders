import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

export interface PropertyImage {
  id: string;
  url: string;
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

/** Map frontend filter values to backend-compatible query params. */
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

/** Normalise enum strings from the backend (PascalCase → lowercase). */
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
    queryFn: () =>
      api
        .get('/properties', { params: buildParams(filter, page) })
        .then(r => {
          const items = asArray<Property>(r.data?.items);
          return {
            data: items.map(normalise),
            total: (r.data?.totalCount as number) ?? 0,
            page: (r.data?.page as number) ?? page,
          };
        }),
  });
}

export function useProperty(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Property>({
    queryKey: ['property', slug, i18n.language],
    queryFn: () => api.get(`/properties/${slug}`).then(r => normalise(asObject<Property>(r.data, {} as Property))),
    enabled: !!slug,
  });
}

export function useFeaturedProperties() {
  const { i18n } = useTranslation();
  return useQuery<Property[]>({
    queryKey: ['properties', 'featured', i18n.language],
    queryFn: () =>
      api.get('/properties/featured').then(r => {
        return asArray<Property>(r.data).map(normalise);
      }),
  });
}
