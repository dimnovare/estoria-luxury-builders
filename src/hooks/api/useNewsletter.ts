import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAdminSubscribers } from './useAdmin';

export interface CampaignDto {
  id: string;
  subject: string;
  bodyHtml: string;
  language?: string | null;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: string; // "Sent" | "Sending" | "Failed" | "Draft"
  sentAt?: string;
  createdAt: string;
}

export interface SendResult {
  id: string;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}

export function useNewsletterCampaigns(page = 1) {
  return useQuery<{ items: CampaignDto[]; totalCount: number }>({
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
