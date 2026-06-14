import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import i18n from '@/i18n';

// ── Types ──────────────────────────────────────────────────────────────────────

export type InboxFolder = 'inbox' | 'sent' | 'archive' | 'all';

/// A folder selection is either one of the four quick-tab keys above or an
/// opaque Graph folder id (the owners' custom per-property folders).
export type FolderSelection = InboxFolder | string;

/// One mail folder from Graph — well-known system folders plus the owners'
/// custom per-property folders. Matches backend MailboxFolderDto.
export interface MailFolder {
  id: string;
  displayName: string;
  total: number;
  unread: number;
  childCount: number;
  parentId?: string | null;
  parentName?: string | null;
  wellKnown: boolean;
}

export interface InboxAttachment {
  id: string;
  name: string;
  contentType?: string;
  size: number;
  isInline?: boolean;
}

export interface InboxMessageSummary {
  id: string;
  folder: FolderSelection;
  from: string;
  fromName: string;
  to: string[];
  subject: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  linkedContactId?: string;
  linkedContactName?: string;
  linkedDealId?: string;
  linkedDealTitle?: string;
  linkedPropertyId?: string;
}

export interface InboxMessageDetail extends InboxMessageSummary {
  cc: string[];
  bcc: string[];
  bodyHtml: string;
  attachments: InboxAttachment[];
  isArchived?: boolean;
}

export interface SendMessagePayload {
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: { filename: string; contentType: string; base64: string }[];
  replyToMessageId?: string;
}

export interface LinkMessagePayload {
  contactId?: string | null;
  dealId?: string | null;
}

export interface InboxFolderCounts {
  inbox: number;
  unread: number;
  sent: number;
  archive: number;
}

/// Cursor-paged Graph response shape — matches backend MailboxPage<T>.
/// Treat nextSkipToken as opaque; pass it back verbatim for "Load more".
export interface MailboxPage<T> {
  items: T[];
  nextSkipToken?: string | null;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

const KEYS = {
  messages: (folder: FolderSelection, filters?: Record<string, unknown>) =>
    ['inbox', 'messages', folder, filters] as const,
  message: (id: string) => ['inbox', 'message', id] as const,
  counts: ['inbox', 'counts'] as const,
  folders: ['inbox', 'folders'] as const,
};

/// Lists the mailbox's folders — the well-known ones plus the owners' custom
/// per-property folders. Empty when Graph isn't configured (dev no-op).
export function useMailFolders() {
  return useQuery({
    queryKey: KEYS.folders,
    queryFn: async () => {
      const { data } = await api.get<MailFolder[]>('/admin/inbox/folders');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useInboxCounts() {
  return useQuery({
    queryKey: KEYS.counts,
    queryFn: async () => {
      const { data } = await api.get<InboxFolderCounts>('/admin/inbox/counts');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useInboxMessages(
  folder: FolderSelection,
  filters?: { unreadOnly?: boolean; hasAttachments?: boolean; linkedToDeal?: boolean },
) {
  return useQuery({
    queryKey: KEYS.messages(folder, filters as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await api.get<MailboxPage<InboxMessageSummary>>(
        '/admin/inbox/messages',
        {
          params: {
            folder,
            unreadOnly:     filters?.unreadOnly     ?? false,
            hasAttachments: filters?.hasAttachments ?? false,
            linkedToDeal:   filters?.linkedToDeal   ?? false,
            top: 50,
          },
        },
      );
      return data;
    },
  });
}

export function useInboxMessage(id: string | null) {
  return useQuery({
    queryKey: KEYS.message(id!),
    queryFn: async () => {
      const { data } = await api.get<InboxMessageDetail>(`/admin/inbox/messages/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSendInboxMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { data } = await api.post('/admin/inbox/send', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox'] });
      toast.success(i18n.t('admin.inbox.toast.sent'));
    },
    onError: () => {
      toast.error(i18n.t('admin.inbox.toast.sendError'));
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/inbox/messages/${id}/read`);
    },
    onMutate: async (id) => {
      // Optimistic: mark as read in all cached message lists. Each entry is
      // a MailboxPage<InboxMessageSummary>; mutate the items array, leave
      // the cursor alone.
      qc.setQueriesData<MailboxPage<InboxMessageSummary>>(
        { queryKey: ['inbox', 'messages'] },
        (old) => old
          ? { ...old, items: old.items.map((m) => (m.id === id ? { ...m, isRead: true } : m)) }
          : old,
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.counts });
    },
  });
}

export function useArchiveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/inbox/messages/${id}/archive`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox'] });
      toast.success(i18n.t('admin.inbox.toast.archived'));
    },
    onError: () => {
      toast.error(i18n.t('admin.inbox.toast.archiveError'));
    },
  });
}

export function useLinkMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: LinkMessagePayload }) => {
      await api.post(`/admin/inbox/messages/${id}/link`, payload);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.message(id) });
      qc.invalidateQueries({ queryKey: ['inbox', 'messages'] });
      toast.success(i18n.t('admin.inbox.toast.linked'));
    },
    onError: () => {
      toast.error(i18n.t('admin.inbox.toast.linkError'));
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async ({ messageId, attachmentId, filename }: { messageId: string; attachmentId: string; filename: string }) => {
      const { data } = await api.get(`/admin/inbox/messages/${messageId}/attachments/${attachmentId}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error(i18n.t('admin.inbox.toast.downloadError'));
    },
  });
}
