import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

interface SiteSettingDto {
  key: string;
  value: string | null;
  valueType?: string;
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * Fetches GET /api/site-settings and exposes a Record keyed by setting key.
 * Most keys are operational config (toggles, URLs) and identical across
 * languages, but a small whitelist (contact.hours, contact.address) is
 * translatable, so we key on i18n.language to refetch on language switch.
 */
export function useSiteSettings() {
  const { i18n } = useTranslation();
  return useQuery<Record<string, string>>({
    queryKey: ['site-settings', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/site-settings');
        const items = asArray<SiteSettingDto>(r.data);
        const map: Record<string, string> = {};
        for (const item of items) {
          if (item?.key) map[item.key] = item.value ?? '';
        }
        return map;
      } catch {
        return {};
      }
    },
    retry: false,
    staleTime: 60_000, // 1 minute — short enough for admin edits to surface quickly
  });
}
