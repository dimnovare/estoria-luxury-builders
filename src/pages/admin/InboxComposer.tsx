import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Paperclip, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSendInboxMessage } from '@/hooks/api/useInbox';
import { cn } from '@/lib/utils';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export interface ComposerPrefill {
  to?: string[];
  subject?: string;
  bodyHtml?: string;
  replyToMessageId?: string;
}

interface Props {
  prefill?: ComposerPrefill;
  onClose: () => void;
}

interface AttachmentFile {
  file: File;
  base64: string;
}

export default function InboxComposer({ prefill, onClose }: Props) {
  const { t } = useTranslation();
  const send = useSendInboxMessage();

  const [to, setTo] = useState<string[]>(prefill?.to ?? []);
  const [toInput, setToInput] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(prefill?.subject ?? '');
  const [bodyHtml, setBodyHtml] = useState(prefill?.bodyHtml ?? '');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [minimized, setMinimized] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSize = attachments.reduce((s, a) => s + a.file.size, 0);

  const addChip = (list: string[], setList: (v: string[]) => void, value: string, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    list: string[],
    setList: (v: string[]) => void,
    input: string,
    setInput: (v: string) => void,
  ) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && input.trim()) {
      e.preventDefault();
      addChip(list, setList, input, setInput);
    }
    if (e.key === 'Backspace' && !input && list.length) {
      setList(list.slice(0, -1));
    }
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: AttachmentFile[] = [];
    let newSize = totalSize;
    for (const file of Array.from(files)) {
      newSize += file.size;
      if (newSize > MAX_ATTACHMENT_SIZE) {
        // Already at limit
        break;
      }
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      newAttachments.push({ file, base64 });
    }
    if (newSize > MAX_ATTACHMENT_SIZE) {
      alert(t('admin.inbox.composer.sizeWarning'));
    }
    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 20));
  }, [totalSize, t]);

  const handleSend = () => {
    if (!to.length || !subject.trim()) return;
    send.mutate(
      {
        to,
        cc: cc.length ? cc : undefined,
        subject,
        bodyHtml,
        attachments: attachments.map((a) => ({
          filename: a.file.name,
          contentType: a.file.type || 'application/octet-stream',
          base64: a.base64,
        })),
        replyToMessageId: prefill?.replyToMessageId,
      },
      { onSuccess: onClose },
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 right-4 z-50 w-full max-w-lg bg-background border border-border rounded-t-lg shadow-xl flex flex-col',
        minimized ? 'h-12' : 'h-[480px] max-h-[80vh]',
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 rounded-t-lg cursor-pointer shrink-0"
        onClick={() => setMinimized(!minimized)}
      >
        <span className="text-sm font-medium text-foreground truncate">
          {prefill?.replyToMessageId ? t('admin.inbox.composer.reply') : t('admin.inbox.composer.newMessage')}
        </span>
        <div className="flex items-center gap-1">
          {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('admin.common.close', 'Close')}
            title={t('admin.common.close', 'Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="flex flex-col flex-1 overflow-hidden" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {/* Fields */}
          <div className="px-4 py-2 space-y-2 border-b border-border shrink-0">
            {/* To */}
            <div className="flex items-center gap-2 flex-wrap border-b border-[hsl(0_0%_92%)] pb-1.5">
              <span className="text-xs text-[hsl(0_0%_25%)] font-medium w-8 shrink-0">{t('admin.inbox.composer.to')}</span>
              {to.map((e) => (
                <Badge key={e} variant="secondary" className="text-xs gap-1">
                  {e}
                  <button
                    type="button"
                    onClick={() => setTo(to.filter((x) => x !== e))}
                    aria-label={t('admin.inbox.composer.removeRecipient', 'Remove {{email}}', { email: e })}
                    title={t('admin.inbox.composer.removeRecipient', 'Remove {{email}}', { email: e })}
                    className="inline-flex"
                  >
                    <X className="h-3 w-3 cursor-pointer" />
                  </button>
                </Badge>
              ))}
              <Input
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, to, setTo, toInput, setToInput)}
                onBlur={() => toInput.trim() && addChip(to, setTo, toInput, setToInput)}
                className="flex-1 min-w-[120px] h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm"
                placeholder={t('admin.inbox.composer.toPlaceholder')}
              />
            </div>

            {/* Cc toggle */}
            {!showCc && (
              <button onClick={() => setShowCc(true)} className="text-xs text-muted-foreground hover:text-foreground">
                {t('admin.inbox.composer.cc', 'Cc')}
              </button>
            )}
            {showCc && (
              <div className="flex items-center gap-2 flex-wrap border-b border-[hsl(0_0%_92%)] pb-1.5">
                <span className="text-xs text-[hsl(0_0%_25%)] font-medium w-8 shrink-0">{t('admin.inbox.composer.cc', 'Cc')}</span>
                {cc.map((e) => (
                  <Badge key={e} variant="secondary" className="text-xs gap-1">
                    {e}
                    <button
                      type="button"
                      onClick={() => setCc(cc.filter((x) => x !== e))}
                      aria-label={t('admin.inbox.composer.removeRecipient', 'Remove {{email}}', { email: e })}
                      title={t('admin.inbox.composer.removeRecipient', 'Remove {{email}}', { email: e })}
                      className="inline-flex"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, cc, setCc, ccInput, setCcInput)}
                  onBlur={() => ccInput.trim() && addChip(cc, setCc, ccInput, setCcInput)}
                  className="flex-1 min-w-[120px] h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm"
                />
              </div>
            )}

            {/* Subject */}
            <div className="border-b border-[hsl(0_0%_92%)] pb-1.5">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('admin.inbox.composer.subject')}
                className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 px-1"
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-4 py-2">
            <Textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder={t('admin.inbox.composer.bodyPlaceholder')}
              className="min-h-full h-full resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm leading-relaxed text-[hsl(0_0%_15%)] placeholder:text-[hsl(0_0%_50%)]"
            />
          </div>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-border space-y-1 max-h-24 overflow-auto shrink-0">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span className="truncate">{a.file.name}</span>
                  <span className="shrink-0">({(a.file.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                    aria-label={t('admin.inbox.composer.removeAttachment', 'Remove {{name}}', { name: a.file.name })}
                    title={t('admin.inbox.composer.removeAttachment', 'Remove {{name}}', { name: a.file.name })}
                    className="inline-flex shrink-0"
                  >
                    <X className="h-3 w-3 cursor-pointer" />
                  </button>
                </div>
              ))}
              {totalSize > MAX_ATTACHMENT_SIZE && (
                <p className="text-xs text-destructive">{t('admin.inbox.composer.sizeWarning')}</p>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border shrink-0">
            <div className="flex items-center gap-2">
              <Button onClick={handleSend} size="sm" disabled={!to.length || !subject.trim() || send.isPending || totalSize > MAX_ATTACHMENT_SIZE}>
                <Send className="h-4 w-4 mr-1" />
                {t('admin.inbox.composer.send')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <Button
                variant="ghost" size="icon"
                onClick={() => fileRef.current?.click()}
                aria-label={t('admin.inbox.composer.attach', 'Attach files')}
                title={t('admin.inbox.composer.attach', 'Attach files')}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
