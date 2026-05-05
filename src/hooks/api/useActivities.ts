import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type AdminActivityType =
  | 'Note'
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Viewing'
  | 'OfferMade'
  | 'StageChange'
  | 'ContractEvent'
  | 'SystemEvent';

/** Static list — these are enum values; no need for a server round-trip. */
export const ACTIVITY_TYPES: AdminActivityType[] = [
  'Note',
  'Call',
  'Email',
  'Meeting',
  'Viewing',
  'OfferMade',
  'StageChange',
  'ContractEvent',
  'SystemEvent',
];

export interface AdminActivity {
  id: string;
  dealId?: string;
  contactId?: string;
  propertyId?: string;
  userId: string;
  userName: string;
  type: AdminActivityType;
  title: string;
  body?: string;
  occurredAt: string;
  durationMinutes?: number;
  outcome?: string;
  createdAt: string;
}

export interface ActivityFilter {
  type?: AdminActivityType;
  userId?: string;
  contactId?: string;
  dealId?: string;
  propertyId?: string;
  occurredAfter?: string;
  occurredBefore?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useActivities(filter: ActivityFilter = {}) {
  return useQuery<{ items: AdminActivity[]; totalCount: number }>({
    queryKey: ['admin', 'activities', filter],
    queryFn: async () => {
      const r = await api.get('/admin/activities', { params: { ...filter } });
      const items = r.data?.items ?? r.data ?? [];
      return { items, totalCount: r.data?.totalCount ?? items.length };
    },
  });
}
