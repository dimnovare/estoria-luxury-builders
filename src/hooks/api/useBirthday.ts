import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type BirthdayLanguage = 'Et' | 'En' | 'Ru';

export interface UpcomingBirthday {
  contactId: string;
  fullName: string;
  dateOfBirth: string;       // ISO date
  email?: string;
  preferredLanguage: BirthdayLanguage;
  consentMarketing: boolean;
  daysUntil: number;
  /** Server-computed age the contact will turn on their next birthday. */
  turningAge: number;
  /** Server-computed next birthday date (this year or next). */
  nextBirthday: string;      // ISO date
}

export interface BirthdayTemplateTranslation {
  language: BirthdayLanguage;
  subject: string;
  bodyHtml: string;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useUpcomingBirthdays(days = 30) {
  return useQuery<UpcomingBirthday[]>({
    queryKey: ['birthday', 'upcoming', days],
    queryFn: () =>
      api.get('/admin/birthday/upcoming', { params: { days } }).then(r => r.data ?? []),
  });
}

/**
 * Always returns three rows (one per language). Languages without saved
 * customizations come back with empty subject/bodyHtml — bind a tab per row
 * without conditional logic.
 */
export function useBirthdayTemplates() {
  return useQuery<BirthdayTemplateTranslation[]>({
    queryKey: ['birthday', 'templates'],
    queryFn: () => api.get('/admin/birthday/template').then(r => r.data ?? []),
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

/**
 * Manual fire. When contactId is supplied, only that contact is mailed;
 * omitting the argument blasts every eligible contact (same rules as the
 * recurring 08:00 UTC job).
 */
export function useSendBirthdayNow() {
  return useMutation({
    mutationFn: (contactId?: string) =>
      api.post('/admin/birthday/send-now', contactId ? { contactId } : {}).then(r => r.data),
  });
}

/** Single-language upsert. The Language enum on the body identifies which tab. */
export function useSaveBirthdayTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (template: BirthdayTemplateTranslation) =>
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
