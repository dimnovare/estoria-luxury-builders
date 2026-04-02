import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

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
  return {
    ...p,
    transactionType: p.transactionType?.toLowerCase(),
    propertyType: p.propertyType?.toLowerCase(),
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
          const items = Array.isArray(r.data?.items) ? r.data.items : [];
          return {
            data: (items as Property[]).map(normalise),
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
    queryFn: () =>
      api.get(`/properties/${slug}`).then(r => normalise(r.data as Property)),
    enabled: !!slug,
  });
}

export function useFeaturedProperties() {
  const { i18n } = useTranslation();
  return useQuery<Property[]>({
    queryKey: ['properties', 'featured', i18n.language],
    queryFn: () =>
      api.get('/properties/featured').then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        return (data as Property[]).map(normalise);
      }),
  });
}
