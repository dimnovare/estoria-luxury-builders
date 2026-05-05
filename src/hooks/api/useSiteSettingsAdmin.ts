import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SiteSettingDto {
  key: string;
  value: string | null;
  valueType?: string; // "Text" | "Number" | "Boolean" | "Json" | "Html"
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

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/admin/site-settings/${encodeURIComponent(key)}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSiteSettings'] });
      qc.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
}
