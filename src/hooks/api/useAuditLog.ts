import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  userEmail: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detailsJson?: string;
  createdAt: string;
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  totalCount: number;
}

interface AuditLogFilters {
  page?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  const { page = 1, userId, action, entityType, from, to } = filters;
  return useQuery<AuditLogResponse>({
    queryKey: ['admin', 'audit-log', page, userId, action, entityType, from, to],
    queryFn: () =>
      api.get('/admin/audit-log', {
        params: {
          page,
          userId: userId || undefined,
          action: action || undefined,
          entityType: entityType || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      }).then(r => r.data),
  });
}
