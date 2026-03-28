import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

export interface Property {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  price: number;
  priceUnit?: string;
  transactionType: 'sale' | 'rent';
  propertyType: string;
  area: number;
  rooms: number;
  bedrooms: number;
  imageUrl: string;
  images?: string[];
  description?: string;
  features?: string[];
}

export function useProperties(filter?: Record<string, string>, page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: Property[]; total: number; page: number }>({
    queryKey: ['properties', filter, page, i18n.language],
    queryFn: () => api.get('/properties', { params: { ...filter, page } }).then(r => r.data),
  });
}

export function useProperty(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Property>({
    queryKey: ['property', slug, i18n.language],
    queryFn: () => api.get(`/properties/${slug}`).then(r => r.data),
    enabled: !!slug,
  });
}

export function useFeaturedProperties() {
  const { i18n } = useTranslation();
  return useQuery<Property[]>({
    queryKey: ['properties', 'featured', i18n.language],
    queryFn: () => api.get('/properties/featured').then(r => r.data),
  });
}
