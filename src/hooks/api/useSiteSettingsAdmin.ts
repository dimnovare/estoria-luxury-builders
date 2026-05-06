import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SiteSettingDto {
  key: string;
  value: string | null;
  valueType?: string; // "Text" | "Number" | "Boolean" | "Json" | "Html"
}

/// Per-language translation row. Language is PascalCase ("Et" | "En" | "Ru")
/// to match the backend Language enum without a casing pass on either side.
export interface SiteSettingTranslationDto {
  language: string;
  value: string;
}

/// Admin-detail shape for a single setting. isTranslatable flips on the
/// language-tabs UI; for non-translatable keys the translations array is
/// empty and Value is authoritative.
export interface SiteSettingAdminDetailDto {
  key: string;
  value: string | null;
  valueType?: string;
  isTranslatable: boolean;
  translations: SiteSettingTranslationDto[];
}

export function useAdminSiteSettings() {
  return useQuery<SiteSettingDto[]>({
    queryKey: ['adminSiteSettings'],
    queryFn: () => api.get('/admin/site-settings').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : [];
    }),
  });
}

/// Per-key admin-detail fetch. Used by the language-tabs editor for
/// translatable keys (contact.hours, contact.address) so the form can
/// pre-populate every tab from a single backend round-trip.
export function useAdminSiteSettingDetail(key: string | undefined) {
  return useQuery<SiteSettingAdminDetailDto>({
    queryKey: ['adminSiteSetting', key],
    queryFn: () =>
      api.get(`/admin/site-settings/${encodeURIComponent(key!)}`).then(r => r.data),
    enabled: !!key,
  });
}

/// Updates a setting. With `lang` set, upserts the per-language translation
/// row for that key (only legal on translatable keys — backend returns 400
/// otherwise). Without `lang`, updates the base Value.
export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, lang }: { key: string; value: string; lang?: string }) =>
      api.put(
        `/admin/site-settings/${encodeURIComponent(key)}`,
        { value },
        { params: lang ? { lang } : undefined },
      ),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['adminSiteSettings'] });
      qc.invalidateQueries({ queryKey: ['adminSiteSetting', vars.key] });
      // Public site cache — language-keyed since the previous prompt, so
      // a prefix invalidation reaches every cached locale at once.
      qc.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
}
