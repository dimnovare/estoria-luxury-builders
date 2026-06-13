import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Inbox, Send as SendIcon, Archive, Mail, Paperclip,
  ArrowLeft, Reply, ReplyAll, Forward, Download, LinkIcon, ExternalLink,
  CircleDot, Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useInboxMessages,
  useInboxMessage,
  useInboxCounts,
  useMarkRead,
  useArchiveMessage,
  useLinkMessage,
  useDownloadAttachment,
  type InboxFolder,
  type InboxMessageSummary,
  type InboxMessageDetail,
  type LinkMessagePayload,
} from '@/hooks/api/useInbox';
import InboxComposer, { type ComposerPrefill } from './InboxComposer';
import SenderActionsPanel from '@/components/admin/SenderActionsPanel';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import { cn } from '@/lib/utils';

// ── Folder config ──────────────────────────────────────────────────────────────

const FOLDERS: { key: InboxFolder; icon: typeof Inbox }[] = [
  { key: 'inbox', icon: Inbox },
  { key: 'sent', icon: SendIcon },
  { key: 'archive', icon: Archive },
  { key: 'all', icon: Mail },
];

type FilterChip = 'unread' | 'hasAttachments' | 'linkedToDeal';

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined) {
  // Belt-and-braces guard: backend already coerces fromName to a non-null
  // "(unknown sender)" fallback, but a string of pure whitespace would
  // still empty out after split/filter — the trailing `|| '?'` handles it.
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function relativeTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FolderList({
  activeFolder,
  onSelect,
  counts,
}: {
  activeFolder: InboxFolder;
  onSelect: (f: InboxFolder) => void;
  // Inbox shows UNREAD count (primary badge). Archive shows total (grey
  // secondary badge). Sent and All don't get badges.
  counts?: { inbox: number; unread: number; sent: number; archive: number };
}) {
  const { t } = useTranslation();
  const badgeFor = (key: InboxFolder): { value: number; variant: 'default' | 'secondary' } | null => {
    if (!counts) return null;
    if (key === 'inbox' && counts.unread > 0) return { value: counts.unread, variant: 'default' };
    if (key === 'archive' && counts.archive > 0) return { value: counts.archive, variant: 'secondary' };
    return null;
  };
  return (
    <div className="space-y-0.5">
      {FOLDERS.map(({ key, icon: Icon }) => {
        const badge = badgeFor(key);
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              activeFolder === key
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{t(`admin.inbox.folders.${key}`)}</span>
            {badge && (
              <Badge
                variant={badge.variant}
                className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] justify-center"
              >
                {badge.value}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FilterChips({
  active,
  onToggle,
}: {
  active: Set<FilterChip>;
  onToggle: (chip: FilterChip) => void;
}) {
  const { t } = useTranslation();
  const chips: { key: FilterChip; label: string; icon: typeof Inbox }[] = [
    { key: 'unread', label: t('admin.inbox.filters.unread'), icon: CircleDot },
    { key: 'hasAttachments', label: t('admin.inbox.filters.hasAttachments'), icon: Paperclip },
    { key: 'linkedToDeal', label: t('admin.inbox.filters.linkedToDeal'), icon: LinkIcon },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors',
            active.has(key)
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground hover:border-foreground/30',
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

function MessageRow({
  msg,
  isSelected,
  onClick,
}: {
  msg: InboxMessageSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full max-w-full flex items-start gap-3 px-3 py-3 text-left transition-colors border-b border-border/50 overflow-hidden',
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
        !msg.isRead && 'bg-muted/20',
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
          {initials(msg.fromName || msg.from)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-sm truncate flex-1 min-w-0', !msg.isRead && 'font-semibold text-foreground')}>
            {msg.fromName || msg.from}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {relativeTime(msg.receivedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          {!msg.isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          <span className="text-xs text-foreground truncate min-w-0">{msg.subject}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.preview}</p>
        <div className="flex items-center gap-2 mt-1 min-w-0">
          {msg.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
          {msg.linkedContactName && (
            <Link
              to={`/admin/contacts/${msg.linkedContactId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-primary hover:underline truncate max-w-[120px]"
            >
              {msg.linkedContactName}
            </Link>
          )}
        </div>
      </div>
    </button>
  );
}

function LinkPopover({
  message,
}: {
  message: InboxMessageDetail;
}) {
  const { t } = useTranslation();
  const link = useLinkMessage();
  const [contactId, setContactId] = useState(message.linkedContactId ?? '');
  const [dealId, setDealId] = useState(message.linkedDealId ?? '');

  const handleSave = () => {
    const payload: LinkMessagePayload = {
      contactId: contactId || null,
      dealId: dealId || null,
    };
    link.mutate({ id: message.id, payload });
  };

  return (
    <PopoverContent className="w-72 space-y-3" align="start">
      <p className="text-sm font-medium">{t('admin.inbox.link.title')}</p>
      <div className="space-y-2">
        <EntityLinkPicker
          type="contact"
          value={contactId || null}
          onChange={(id) => setContactId(id ?? '')}
          label={t('admin.inbox.link.contactId')}
          placeholder={t('admin.inbox.link.contactPickerPlaceholder', 'Search contacts…')}
        />
        <EntityLinkPicker
          type="deal"
          value={dealId || null}
          onChange={(id) => setDealId(id ?? '')}
          label={t('admin.inbox.link.dealId')}
          placeholder={t('admin.inbox.link.dealPickerPlaceholder', 'Search deals…')}
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={link.isPending} className="w-full">
        {t('admin.inbox.link.save')}
      </Button>
    </PopoverContent>
  );
}

function MessageDetail({
  message,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  isMobile = false,
}: {
  message: InboxMessageDetail;
  onBack: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  isMobile?: boolean;
}) {
  const { t } = useTranslation();
  const archiveMut = useArchiveMessage();
  const downloadMut = useDownloadAttachment();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onBack}
            aria-label={t('admin.common.back')}
            title={t('admin.common.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold text-foreground truncate flex-1">{message.subject}</h2>
          <Button
            variant="ghost" size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => archiveMut.mutate(message.id)}
            disabled={archiveMut.isPending}
            aria-label={t('admin.inbox.detail.archive', 'Archive')}
            title={t('admin.inbox.detail.archive', 'Archive')}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{message.fromName || message.from}</span>
            <span>&lt;{message.from}&gt;</span>
          </div>
          <span className="shrink-0">{relativeTime(message.receivedAt)}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          {message.to?.length ? (
            <span>{t('admin.inbox.detail.to')}: {message.to.join(', ')}</span>
          ) : null}
          {message.cc?.length ? (
            <span className="ml-2">{t('admin.inbox.detail.cc', 'Cc')}: {message.cc.join(', ')}</span>
          ) : null}
        </div>

        {/* Linked entities */}
        <div className="flex items-center gap-2 flex-wrap">
          {message.linkedContactName && (
            <Link to={`/admin/contacts/${message.linkedContactId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" />
              {message.linkedContactName}
            </Link>
          )}
          {message.linkedDealTitle && (
            <Link to={`/admin/deals/${message.linkedDealId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" />
              {message.linkedDealTitle}
            </Link>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                {t('admin.inbox.link.edit')}
              </button>
            </PopoverTrigger>
            <LinkPopover message={message} />
          </Popover>
        </div>
      </div>

      {/* Body — rendered in sandboxed iframe (no DOMPurify available) */}
      <div className="flex-1 overflow-auto p-4">
        {/* TODO: Add DOMPurify dependency for safer HTML rendering */}
        <iframe
          srcDoc={message.bodyHtml}
          sandbox=""
          title={t('admin.inbox.detail.bodyFrameTitle', 'Email body')}
          className="w-full min-h-[300px] h-full border-0 bg-white rounded"
          style={{ colorScheme: 'light' }}
        />
      </div>

      {/* Attachments */}
      {message.attachments?.length ? (
        <div className="px-4 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground mb-2">{t('admin.inbox.detail.attachments')} ({message.attachments.length})</p>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <Card key={att.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[140px]">{att.name}</span>
                <span className="text-muted-foreground shrink-0">({(att.size / 1024).toFixed(0)} KB)</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => downloadMut.mutate({ messageId: message.id, attachmentId: att.id, filename: att.name })}
                  aria-label={t('admin.inbox.detail.download', 'Download {{name}}', { name: att.name })}
                  title={t('admin.inbox.detail.download', 'Download {{name}}', { name: att.name })}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Reply toolbar — sticky bottom bar on mobile, inline on desktop */}
      <div className={cn(
        'border-t border-border flex items-center gap-2 shrink-0',
        isMobile
          ? 'px-3 py-3 bg-white sticky bottom-0 z-10'
          : 'px-4 py-3',
      )}>
        <Button variant="outline" size="sm" onClick={onReply} className={isMobile ? 'flex-1' : undefined}>
          <Reply className="h-4 w-4 mr-1" />
          {t('admin.inbox.detail.reply')}
        </Button>
        <Button variant="outline" size="sm" onClick={onReplyAll} className={isMobile ? 'flex-1' : undefined}>
          <ReplyAll className="h-4 w-4 mr-1" />
          {isMobile ? '' : t('admin.inbox.detail.replyAll')}
          {isMobile && <span className="sr-only">{t('admin.inbox.detail.replyAll')}</span>}
        </Button>
        <Button variant="outline" size="sm" onClick={onForward} className={isMobile ? 'flex-1' : undefined}>
          <Forward className="h-4 w-4 mr-1" />
          {isMobile ? '' : t('admin.inbox.detail.forward')}
          {isMobile && <span className="sr-only">{t('admin.inbox.detail.forward')}</span>}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

// Mobile uses a 3-step wizard (folders → list → detail).
// Desktop keeps the standard 3-pane layout.
type MobileStep = 1 | 2 | 3;

export default function AdminInbox() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [folder, setFolder] = useState<InboxFolder>('inbox');
  const [filters, setFilters] = useState<Set<FilterChip>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerPrefill | null>(null);
  // Mobile navigation step: 1=folders, 2=list, 3=detail
  const [mobileStep, setMobileStep] = useState<MobileStep>(1);

  const filterParams = useMemo(
    () => ({
      unreadOnly: filters.has('unread') || undefined,
      hasAttachments: filters.has('hasAttachments') || undefined,
      linkedToDeal: filters.has('linkedToDeal') || undefined,
    }),
    [filters],
  );

  const { data: counts } = useInboxCounts();
  const { data: messagesPage, isLoading } = useInboxMessages(folder, filterParams);
  const messages = messagesPage?.items ?? [];
  const { data: selectedMessage } = useInboxMessage(selectedId);
  const markRead = useMarkRead();

  const toggleFilter = (chip: FilterChip) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  const handleSelectFolder = (f: InboxFolder) => {
    setFolder(f);
    setSelectedId(null);
    if (isMobile) setMobileStep(2);
  };

  const handleSelectMessage = (msg: InboxMessageSummary) => {
    setSelectedId(msg.id);
    if (!msg.isRead) markRead.mutate(msg.id);
    if (isMobile) setMobileStep(3);
  };

  const buildReplyPrefill = (mode: 'reply' | 'replyAll' | 'forward'): ComposerPrefill | null => {
    if (!selectedMessage) return null;
    const subjectPrefix = selectedMessage.subject.startsWith('Re:') ? '' : 'Re: ';
    const quoted = `\n\nOn ${new Date(selectedMessage.receivedAt).toLocaleString()}, ${selectedMessage.fromName || selectedMessage.from} wrote:\n> ${selectedMessage.bodyHtml.replace(/<[^>]*>/g, '').replace(/\n/g, '\n> ')}`;

    if (mode === 'forward') {
      return {
        subject: selectedMessage.subject.startsWith('Fwd:') ? selectedMessage.subject : `Fwd: ${selectedMessage.subject}`,
        bodyHtml: quoted,
      };
    }

    return {
      to: mode === 'replyAll'
        ? [selectedMessage.from, ...selectedMessage.to.filter((e) => e !== selectedMessage.from)]
        : [selectedMessage.from],
      subject: `${subjectPrefix}${selectedMessage.subject}`,
      bodyHtml: quoted,
      replyToMessageId: selectedMessage.id,
    };
  };

  // ── Pane visibility helpers ────────────────────────────────────────────────
  // Desktop: all three panes always visible.
  // Mobile: exactly one pane visible at a time based on mobileStep.
  const showFolderPane  = !isMobile || mobileStep === 1;
  const showListPane    = !isMobile || mobileStep === 2;
  const showDetailPane  = !isMobile || mobileStep === 3;

  // ── Mobile: back-from-list header label ───────────────────────────────────
  const folderLabel = t(`admin.inbox.folders.${folder}`);

  return (
    <div className="space-y-4">
      {/* Page header — hidden on mobile when deep in the wizard (steps 2/3) */}
      {(!isMobile || mobileStep === 1) && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-semibold text-foreground">{t('admin.inbox.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.inbox.subtitle', 'Shared mailbox for info@estoria.estate. Emails appear here when Microsoft Graph is configured. For contact form submissions, see Messages.')}</p>
          </div>
          {!isMobile && (
            <Button size="sm" onClick={() => setComposer({})} aria-label={t('admin.inbox.compose')} title={t('admin.inbox.compose')}>
              <Mail className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('admin.inbox.compose')}</span>
            </Button>
          )}
        </div>
      )}

      {/* Three-pane layout */}
      <Card className="overflow-hidden w-full max-w-full" style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 180px)', minHeight: 500 }}>
        <div className="flex h-full min-w-0 w-full">

          {/* LEFT pane — folders + filters */}
          {showFolderPane && (
            <div className={cn(
              'border-r border-border flex flex-col shrink-0 bg-muted/10',
              isMobile ? 'w-full' : 'w-[220px] lg:w-[260px]',
            )}>
              <div className="p-3 space-y-4 overflow-auto flex-1">
                {isMobile && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-1">
                    {t('admin.inbox.title')}
                  </p>
                )}
                <FolderList
                  activeFolder={folder}
                  onSelect={handleSelectFolder}
                  counts={counts}
                />
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {t('admin.inbox.filtersTitle')}
                  </p>
                  <FilterChips active={filters} onToggle={toggleFilter} />
                </div>
              </div>
            </div>
          )}

          {/* MIDDLE pane — message list */}
          {showListPane && (
            <div className={cn(
              'border-r border-border flex flex-col overflow-hidden min-w-0',
              isMobile ? 'w-full flex-1' : 'w-[320px] lg:w-[380px]',
            )}>
              {/* Mobile: back arrow + current folder name */}
              {isMobile && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/10">
                  <button
                    onClick={() => setMobileStep(1)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={t('admin.common.back')}
                    title={t('admin.common.back')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium flex-1">{folderLabel}</span>
                  {(counts?.[folder] ?? 0) > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{counts?.[folder]}</Badge>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">{t('admin.inbox.loading')}</div>
                ) : messages.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">{t('admin.inbox.empty')}</div>
                ) : (
                  messages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      isSelected={msg.id === selectedId}
                      onClick={() => handleSelectMessage(msg)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* RIGHT pane — message detail */}
          {showDetailPane && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {selectedMessage ? (
                <>
                  <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <MessageDetail
                      message={selectedMessage}
                      onBack={() => isMobile ? setMobileStep(2) : setSelectedId(null)}
                      onReply={() => setComposer(buildReplyPrefill('reply')!)}
                      onReplyAll={() => setComposer(buildReplyPrefill('replyAll')!)}
                      onForward={() => setComposer(buildReplyPrefill('forward')!)}
                      isMobile={isMobile}
                    />
                  </div>
                  {!isMobile && <SenderActionsPanel message={selectedMessage} />}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                  {t('admin.inbox.selectMessage')}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Mobile FAB — compose button, only visible on steps 1 & 2 */}
      {isMobile && mobileStep !== 3 && (
        <button
          onClick={() => setComposer({})}
          className="fixed bottom-20 right-4 z-20 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          aria-label={t('admin.inbox.compose')}
        >
          <Pencil className="h-5 w-5" />
        </button>
      )}

      {/* Composer */}
      {composer && <InboxComposer prefill={composer} onClose={() => setComposer(null)} />}
    </div>
  );
}
