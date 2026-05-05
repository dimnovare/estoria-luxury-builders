import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UpcomingBirthday {
  contactId: string;
  fullName: string;
  dateOfBirth: string;
  email?: string;
  /** How old they are turning */
  turningAge: number;
  /** The upcoming birthday date (this year or next) */
  birthdayDate: string;
}

export interface BirthdayTemplate {
  language: string;
  subject: string;
  bodyHtml: string;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useUpcomingBirthdays(days = 30) {
  return useQuery<UpcomingBirthday[]>({
    queryKey: ['birthday', 'upcoming', days],
    queryFn: () =>
      api.get('/admin/birthday/upcoming', { params: { days } }).then(r => r.data),
  });
}

export function useBirthdayTemplates() {
  return useQuery<BirthdayTemplate[]>({
    queryKey: ['birthday', 'templates'],
    queryFn: () => api.get('/admin/birthday/template').then(r => r.data),
  });
}

export function useBirthdayAutoSend() {
  return useQuery<boolean>({
    queryKey: ['birthday', 'auto-send'],
    queryFn: async () => {
      const r = await api.get('/admin/site-settings/birthday.auto_send');
      // Value might be a string "true"/"false" or boolean
      const val = r.data?.value ?? r.data;
      return val === true || val === 'true';
    },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useSendBirthdayNow() {
  return useMutation({
    mutationFn: (contactId: string) =>
      api.post('/admin/birthday/send-now', { contactId }).then(r => r.data),
  });
}

export function useSaveBirthdayTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (template: BirthdayTemplate) =>
      api.put('/admin/birthday/template', template).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['birthday', 'templates'] });
    },
  });
}

export function useSetBirthdayAutoSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api.put('/admin/site-settings/birthday.auto_send', { value: enabled }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['birthday', 'auto-send'] });
    },
  });
}
