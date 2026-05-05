import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface SiteSettingDto {
  key: string;
  value: string | null;
  valueType?: string;
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * Fetches GET /api/site-settings once and exposes a Record keyed by setting key.
 * Settings are language-independent (operational config, not translated copy)
 * so the queryKey deliberately omits i18n.language — same response for all locales.
 */
export function useSiteSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ['site-settings'],
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
    staleTime: 5 * 60 * 1000, // 5 minutes — these change rarely
  });
}
