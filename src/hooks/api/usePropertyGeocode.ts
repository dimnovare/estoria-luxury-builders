import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

/// Forward-geocodes the property's English (or first-available) address via
/// the backend, which proxies to OpenStreetMap Nominatim. The button on the
/// property form calls this and pipes the result back into the lat/long
/// inputs — see PropertyForm.tsx.
export function useGeocodeProperty() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<GeoCoords>(`/admin/properties/${id}/geocode`).then(r => r.data),
  });
}

export interface GeocodeMissingResult {
  total: number;
  geocoded: number;
  failed: number;
  results: Array<{ id: string; slug: string; resolved: boolean; reason?: string }>;
}

/// Bulk-geocodes every non-archived property that has no coordinates yet and
/// persists them server-side, so the public map renders without opening each
/// listing. Runs sequentially on the backend (Nominatim's 1 req/sec policy),
/// so it can take a few seconds. Invalidates the admin list on success.
export function useGeocodeMissing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<GeocodeMissingResult>('/admin/properties/geocode-missing').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property'] });
    },
  });
}
