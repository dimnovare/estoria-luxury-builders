import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import i18n from '@/i18n';

// ── Error helpers ──────────────────────────────────────────────────────────────

function isForbidden(err: unknown): boolean {
  return (err as any)?.response?.status === 403;
}

function getErrorDetail(err: unknown): string {
  return (err as any)?.response?.data?.detail || (err as any)?.response?.data?.title || '';
}

/** Show a friendly toast for 403 errors, generic for others */
export function handleCrmError(err: unknown, fallbackMsg: string) {
  if (isForbidden(err)) {
    toast.error(i18n.t('admin.crm.toast.forbidden'), {
      description: getErrorDetail(err) || undefined,
    });
  } else {
    toast.error(fallbackMsg);
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CrmContact {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  company?: string;
  position?: string;
  address?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  isBuyer: boolean;
  isSeller: boolean;
  isTenant: boolean;
  isLandlord: boolean;
  isPartner: boolean;
  source?: string;
  sourceDetail?: string;
  tags: string[];
  consentToMarketing: boolean;
  consentToMarketingAt?: string;
  notes?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  photoUrl?: string;
  lastActivityAt?: string;
  createdAt: string;
}

export type DealStage =
  | 'Lead' | 'Qualified' | 'Viewing' | 'Offer'
  | 'Negotiation' | 'ContractSigned' | 'ClosingPending' | 'Won' | 'Lost';

export const DEAL_STAGES: DealStage[] = [
  'Lead', 'Qualified', 'Viewing', 'Offer',
  'Negotiation', 'ContractSigned', 'ClosingPending', 'Won', 'Lost',
];

export type DealType = 'Sale' | 'Rent';
export type DealSide = 'BuySide' | 'SellSide';

export interface DealListDto {
  id: string;
  title: string;
  stage: DealStage;
  dealType: DealType;
  side: DealSide;
  expectedValue?: number;
  actualValue?: number;
  currency: string;
  expectedCloseDate?: string;
  commissionPercent?: number;
  lossReason?: string;
  primaryContactId: string;
  primaryContactName: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyThumbUrl?: string;
  assignedAgentId: string;
  assignedAgentName: string;
  stageChangedAt: string;
  wonAt?: string;
  lostAt?: string;
  createdAt: string;
}

export interface DealDetail extends DealListDto {
  participants: DealParticipant[];
}

export interface DealParticipant {
  id: string;
  contactId: string;
  contactName: string;
  role: string;
}

export type ActivityType =
  | 'Note' | 'Call' | 'Email' | 'Meeting' | 'Viewing'
  | 'OfferMade' | 'StageChange' | 'ContractEvent' | 'SystemEvent';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  body?: string;
  outcome?: string;
  durationMinutes?: number;
  contactId?: string;
  dealId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ContactNote {
  id: string;
  contactId: string;
  body: string;
  isPinned: boolean;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

// ── Filter types ───────────────────────────────────────────────────────────────

export interface ContactFilter {
  search?: string;
  agentId?: string;
  source?: string;
  tag?: string;
  isBuyer?: boolean;
  isSeller?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DealFilter {
  agentId?: string;
  dealType?: DealType;
  side?: DealSide;
  mineOnly?: boolean;
}

export interface ActivityFilter {
  contactId?: string;
  dealId?: string;
  type?: ActivityType;
  page?: number;
  pageSize?: number;
}

// ── Contacts ───────────────────────────────────────────────────────────────────

export function useContacts(filter: ContactFilter = {}) {
  return useQuery<{ items: CrmContact[]; totalCount: number }>({
    queryKey: ['crm', 'contacts', filter],
    queryFn: () =>
      api.get('/admin/contacts', { params: { ...filter } }).then(r => r.data),
  });
}

export function useContact(id?: string) {
  return useQuery<CrmContact>({
    queryKey: ['crm', 'contact', id],
    queryFn: () => api.get(`/admin/contacts/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/contacts', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/contacts/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      qc.invalidateQueries({ queryKey: ['crm', 'contact', vars.id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

// ── Deals ──────────────────────────────────────────────────────────────────────

export function useDeals(filter: DealFilter = {}) {
  return useQuery<Record<string, DealListDto[]>>({
    queryKey: ['crm', 'deals', filter],
    queryFn: () =>
      api.get('/admin/deals/kanban', { params: { ...filter } }).then(r => r.data),
  });
}

export function useDeal(id?: string) {
  return useQuery<DealDetail>({
    queryKey: ['crm', 'deal', id],
    queryFn: () => api.get(`/admin/deals/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/deals', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/deals/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      qc.invalidateQueries({ queryKey: ['crm', 'deal', vars.id] });
    },
  });
}

export function useChangeStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, actualValue, lossReason }: {
      id: string; stage: DealStage; actualValue?: number; lossReason?: string;
    }) => api.post(`/admin/deals/${id}/stage`, { stage, actualValue, lossReason }).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      qc.invalidateQueries({ queryKey: ['crm', 'deal', vars.id] });
    },
  });
}

// ── Deal Participants ──────────────────────────────────────────────────────────

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, dto }: { dealId: string; dto: { contactId: string; role: string } }) =>
      api.post(`/admin/deals/${dealId}/participants`, dto).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deal', vars.dealId] });
    },
  });
}

export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, participantId }: { dealId: string; participantId: string }) =>
      api.delete(`/admin/deals/${dealId}/participants/${participantId}`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deal', vars.dealId] });
    },
  });
}

// ── Activities ─────────────────────────────────────────────────────────────────

export function useActivities(filter: ActivityFilter = {}) {
  return useQuery<{ items: Activity[]; totalCount: number }>({
    queryKey: ['crm', 'activities', filter],
    queryFn: () =>
      api.get('/admin/activities', { params: { ...filter } }).then(r => r.data),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/activities', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/activities/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/activities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });
}

// ── Contact Notes ──────────────────────────────────────────────────────────────

export function useContactNotes(contactId?: string) {
  return useQuery<ContactNote[]>({
    queryKey: ['crm', 'contact-notes', contactId],
    queryFn: () => api.get(`/admin/contacts/${contactId}/notes`).then(r => r.data),
    enabled: !!contactId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, dto }: { contactId: string; dto: { body: string } }) =>
      api.post(`/admin/contacts/${contactId}/notes`, dto).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contact-notes', vars.contactId] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, noteId, dto }: { contactId: string; noteId: string; dto: object }) =>
      api.put(`/admin/contacts/${contactId}/notes/${noteId}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contact-notes', vars.contactId] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, noteId }: { contactId: string; noteId: string }) =>
      api.delete(`/admin/contacts/${contactId}/notes/${noteId}`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contact-notes', vars.contactId] });
    },
  });
}

export function useToggleNotePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, noteId, isPinned }: { contactId: string; noteId: string; isPinned: boolean }) =>
      api.put(`/admin/contacts/${contactId}/notes/${noteId}`, { isPinned }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contact-notes', vars.contactId] });
    },
    // Optimistic update for pin toggle
    onMutate: async (vars) => {
      const key = ['crm', 'contact-notes', vars.contactId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ContactNote[]>(key);
      if (prev) {
        qc.setQueryData<ContactNote[]>(key, prev.map(n =>
          n.id === vars.noteId ? { ...n, isPinned: vars.isPinned } : n
        ));
      }
      return { prev };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['crm', 'contact-notes', vars.contactId], ctx.prev);
      }
    },
  });
}

// ── Contact search (for autocomplete) ──────────────────────────────────────────

export function useContactSearch(search: string) {
  return useQuery<CrmContact[]>({
    queryKey: ['crm', 'contacts-search', search],
    queryFn: () =>
      api.get('/admin/contacts', { params: { search, pageSize: 10 } })
        .then(r => r.data?.items ?? r.data),
    enabled: search.length >= 2,
  });
}

// ── Agents list (for dropdowns) ────────────────────────────────────────────────

export interface AgentOption {
  id: string;
  fullName: string;
  email: string;
}

export function useAgents() {
  return useQuery<AgentOption[]>({
    queryKey: ['crm', 'agents'],
    queryFn: () =>
      api.get('/admin/users', { params: { role: 'Agent', pageSize: 100 } })
        .then(r => {
          const data = r.data;
          return data?.items ?? data;
        }),
  });
}
