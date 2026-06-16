import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * KV.EE import status API layer.
 *
 * Read-only view of what KV.EE reported back for each exported listing via the
 * REDE `objectUpdateCompleted` callback — its kv.ee URL, view count, expiry and
 * any failure. Mirrors the axios `api` (JWT bearer + lang) + react-query
 * conventions used across the admin hooks.
 *
 * Endpoint (admin, /api prefix supplied by the axios baseURL):
 *   /admin/kv-import-status
 */

export interface KvImportResult {
  id: string;
  /** REDE originalId — exceeds JS safe-int range; never use as a key or display it. */
  originalId: number;
  propertyId: string | null;
  propertyTitle: string | null;
  externalId: number | null;
  externalUrl: string | null;
  viewedTimes: number | null;
  /** ISO date (yyyy-MM-dd) or null. */
  expireDate: string | null;
  status: string;
  message: string | null;
  /** ISO datetime. */
  receivedAt: string;
}

export interface KvImportResultList {
  items: KvImportResult[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface KvImportStatusParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const kvImportKeys = {
  list: (params?: KvImportStatusParams) => ['kv-import-status', params ?? {}] as const,
};

export function useKvImportStatus(params: KvImportStatusParams = {}) {
  return useQuery<KvImportResultList>({
    queryKey: kvImportKeys.list(params),
    queryFn: () =>
      api.get('/admin/kv-import-status', { params: { ...params } }).then((r) => r.data),
  });
}
