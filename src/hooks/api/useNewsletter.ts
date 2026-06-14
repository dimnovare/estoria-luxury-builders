import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAdminSubscribers } from './useAdmin';

export interface CampaignDto {
  id: string;
  subject: string;
  bodyHtml: string;
  languageFilter?: string | null;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: string; // "Sent" | "Sending" | "Failed" | "Draft"
  completedAt?: string;
  createdAt: string;
}

export interface SendResult {
  id: string;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}

type CampaignPage = {
  items: CampaignDto[];
  totalCount: number;
};

type CampaignSnapshots = Array<[QueryKey, CampaignPage | undefined]>;

export function useNewsletterCampaigns(page = 1) {
  return useQuery<CampaignPage>({
    queryKey: ['admin', 'campaigns', page],
    queryFn: () =>
      api.get('/admin/newsletter/campaigns', { params: { page, pageSize: 20 } }).then(r => r.data),
  });
}

export function useNewsletterCampaign(id?: string) {
  return useQuery<CampaignDto>({
    queryKey: ['admin', 'campaign', id],
    queryFn: () => api.get(`/admin/newsletter/campaigns/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useSendNewsletterNow() {
  const qc = useQueryClient();
  return useMutation<SendResult, Error, {
    subject: string;
    bodyHtml: string;
    language?: string;
    testRecipientEmail?: string;
  }>({
    mutationFn: (payload) =>
      api.post('/admin/newsletter/campaigns/send-now', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation<void, Error, string, { snapshots: CampaignSnapshots }>({
    mutationFn: (id) => api.delete(`/admin/newsletter/campaigns/${id}`).then(() => undefined),
    // Optimistically remove the row from all paged campaign queries.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'campaigns'] });
      const snapshots = qc.getQueriesData<CampaignPage>({ queryKey: ['admin', 'campaigns'] });
      snapshots.forEach(([key, data]) => {
        if (data?.items) {
          qc.setQueryData(key, {
            ...data,
            items: data.items.filter(c => c.id !== id),
            totalCount: Math.max(0, (data.totalCount ?? 0) - 1),
          });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      // Roll back on failure
      ctx?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
}

export function useSubscribeContact() {
  return useMutation<void, Error, { email: string; language?: string }>({
    mutationFn: ({ email, language }) =>
      api.post('/newsletter/subscribe', { email, language }).then(() => undefined),
  });
}

/**
 * Client-side subscriber count by language filter.
 * Falls back to filtering the full subscriber list.
 */
export function useNewsletterSubscriberCount(language?: string) {
  const { data } = useAdminSubscribers(1);
  const subscribers = data?.items ?? [];
  if (!language) return subscribers.filter(s => s.isActive).length;
  return subscribers.filter(s => s.isActive && s.language.toLowerCase() === language.toLowerCase()).length;
}
