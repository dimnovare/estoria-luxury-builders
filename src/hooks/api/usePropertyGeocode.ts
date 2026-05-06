import { useMutation } from '@tanstack/react-query';
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
