import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type SavedSearchFrequency = 'Instant' | 'Daily' | 'Weekly';

export interface SavedSearchFilter {
  type?: string;
  transaction?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  minRooms?: number;
  maxRooms?: number;
  features?: string[];
}

export interface SavedSearchCreatePayload {
  email: string;
  name?: string;
  preferredLanguage?: 'Et' | 'En' | 'Ru';
  filter: SavedSearchFilter;
  frequency: SavedSearchFrequency;
}

export interface SavedSearchDto {
  id: string;
  email: string;
  contactId?: string;
  name?: string;
  preferredLanguage: 'Et' | 'En' | 'Ru';
  filter: SavedSearchFilter;
  frequency: SavedSearchFrequency;
  lastSentAt?: string;
  lastResultsCount: number;
  isActive: boolean;
  createdAt: string;
}

// ── Public ────────────────────────────────────────────────────────────────

/** Anonymous public POST — rate-limited server-side under "newsletter" policy. */
export function useCreateSavedSearch() {
  return useMutation({
    mutationFn: (payload: SavedSearchCreatePayload) =>
      api.post('/saved-searches', payload).then(r => r.data),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────

export function useAdminSavedSearches(filter: { frequency?: SavedSearchFrequency; isActive?: boolean } = {}) {
  return useQuery<SavedSearchDto[]>({
    queryKey: ['admin', 'saved-searches', filter],
    queryFn: async () => {
      const r = await api.get('/admin/saved-searches', { params: filter });
      return Array.isArray(r.data) ? r.data : [];
    },
  });
}

export function useForceSendSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/saved-searches/${id}/force-send`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'saved-searches'] }),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/saved-searches/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'saved-searches'] }),
  });
}

// ── Property history ──────────────────────────────────────────────────────

export interface PropertyHistoryEvent {
  id: string;
  type:
    | 'Created'
    | 'PriceChanged'
    | 'StatusChanged'
    | 'PublishedFirst'
    | 'Featured'
    | 'Unfeatured'
    | 'ImageAdded'
    | 'ImageRemoved'
    | 'AgentChanged';
  createdAt: string;
  /** JSON-as-string; the consumer parses what it needs (e.g. PriceChanged → {price, currency}). */
  previousJson?: string;
  newJson?: string;
}

export function usePropertyHistory(slug?: string, limit = 20) {
  return useQuery<PropertyHistoryEvent[]>({
    queryKey: ['property', slug, 'history', limit],
    queryFn: async () => {
      const r = await api.get(`/properties/${slug}/history`, { params: { limit } });
      return Array.isArray(r.data) ? r.data : [];
    },
    enabled: !!slug,
    retry: false,
  });
}
