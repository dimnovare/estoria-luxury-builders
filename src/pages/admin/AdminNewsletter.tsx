import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Trash2, Send, TestTube2, Mail, Inbox } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';

import { useAdminSubscribers, useUnsubscribe } from '@/hooks/api/useAdmin';
import { useNewsletterCampaigns, useSendNewsletterNow, useNewsletterSubscriberCount, useDeleteCampaign, type CampaignDto } from '@/hooks/api/useNewsletter';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/api/useSiteSettings';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { format } from 'date-fns';
import { formatDate } from '@/lib/formatDate';

// ── Compose schema ──────────────────────────────────────────────────────────

const composeSchema = z.object({
  subject: z.string().min(3).max(300),
  bodyHtml: z.string().min(10).max(100_000),
  language: z.string().optional(),
});

type ComposeValues = z.infer<typeof composeSchema>;

// ── Status badge helper ─────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'Sent' ? 'bg-success/10 text-success border-success/30' :
    status === 'Sending' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
    status === 'Failed' ? 'bg-destructive/10 text-destructive border-destructive/30' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{status}</Badge>;
}

// ── TAB 1: Compose ──────────────────────────────────────────────────────────

function ComposeTab() {
  const { t } = useTranslation();
  const { email } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const fromEmail = siteSettings?.['contact.email'] ?? 'noreply@estoria.estate';
  const sendMut = useSendNewsletterNow();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: { subject: '', bodyHtml: '', language: undefined },
  });

  const lang = form.watch('language');
  const bodyHtml = form.watch('bodyHtml');
  const debouncedBody = useDebouncedValue(bodyHtml, 300);
  const recipientCount = useNewsletterSubscriberCount(lang === 'all' ? undefined : lang);

  const onSendNow = async () => {
    setConfirmOpen(false);
    const vals = form.getValues();
    try {
      const r = await sendMut.mutateAsync({
        subject: vals.subject,
        bodyHtml: vals.bodyHtml,
        language: vals.language === 'all' ? undefined : vals.language,
      });
      toast.success(t('admin.newsletter.compose.toast.sent', { delivered: r.successCount, failed: r.failureCount }));
      form.reset();
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err?.response?.data?.detail ?? err?.message ?? t('admin.newsletter.compose.toast.sendFailed'));
    }
  };

  const onSendTest = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    const vals = form.getValues();
    try {
      await sendMut.mutateAsync({
        subject: vals.subject,
        bodyHtml: vals.bodyHtml,
        language: vals.language === 'all' ? undefined : vals.language,
        testRecipientEmail: email ?? undefined,
      });
      toast.success(t('admin.newsletter.compose.toast.testSent'));
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err?.response?.data?.detail ?? err?.message ?? t('admin.newsletter.compose.toast.sendFailed'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — form */}
      <div className="space-y-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(() => setConfirmOpen(true))}>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-muted-foreground">{t('admin.newsletter.compose.subject')}</FormLabel>
                  <FormControl><Input {...field} className="bg-muted border-border text-foreground placeholder:text-muted-foreground" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-muted-foreground">{t('admin.newsletter.compose.languageFilter')}</FormLabel>
                  <Select value={field.value ?? 'all'} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.newsletter.compose.langAll')}</SelectItem>
                      <SelectItem value="Et">{t('admin.newsletter.compose.langEt')}</SelectItem>
                      <SelectItem value="En">{t('admin.newsletter.compose.langEn')}</SelectItem>
                      <SelectItem value="Ru">{t('admin.newsletter.compose.langRu')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-muted-foreground">{t('admin.newsletter.compose.body')}</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('admin.newsletter.compose.body')}
                      minHeight="320px"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('admin.newsletter.compose.bodyHelp')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                {t('admin.newsletter.compose.willReach', { count: recipientCount })}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={sendMut.isPending}>
                <Send className="h-4 w-4 mr-2" />{t('admin.newsletter.compose.sendNow')}
              </Button>
              <Button type="button" variant="outline" className="border-border text-foreground" onClick={onSendTest} disabled={sendMut.isPending}>
                <TestTube2 className="h-4 w-4 mr-2" />{t('admin.newsletter.compose.sendTest')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right — preview */}
      <div className="space-y-2">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">{t('admin.newsletter.compose.from')}:</span> {fromEmail}</p>
              <p><span className="font-medium">{t('admin.newsletter.compose.to')}:</span> {recipientCount} {t('admin.newsletter.compose.subscribers')}</p>
            </div>
            {debouncedBody ? (
              <iframe
                srcDoc={debouncedBody}
                sandbox=""
                className="w-full max-h-[600px] border border-border rounded bg-card"
                style={{ minHeight: 200 }}
                title={t('admin.newsletter.compose.previewFrameTitle', 'Preview')}
              />
            ) : (
              <div className="h-[200px] bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                {t('admin.newsletter.compose.previewPlaceholder')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.newsletter.compose.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin.newsletter.compose.confirmDesc', { count: recipientCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t('admin.common.cancel')}</Button>
            <Button onClick={onSendNow} disabled={sendMut.isPending}>{t('admin.newsletter.compose.confirmSend')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TAB 2: Campaigns ────────────────────────────────────────────────────────

function CampaignsTab() {
  const { t } = useTranslation();
  const [page] = useState(1);
  const { data, isLoading, isError, refetch } = useNewsletterCampaigns(page);
  const campaigns = data?.items ?? [];
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailCampaign = campaigns.find(c => c.id === detailId);
  const deleteCampaign = useDeleteCampaign();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success(t('admin.newsletter.campaigns.deleted'));
    } catch {
      toast.error(t('admin.newsletter.campaigns.deleteFailed'));
    }
  };

  return (
    <>
      {isError ? (
        <ErrorState
          description={t('admin.newsletter.campaigns.loadError', 'Could not load campaigns. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={8} />
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={t('admin.newsletter.campaigns.emptyTitle', 'No campaigns yet')}
              description={t('admin.newsletter.campaigns.empty')}
            />
          ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs">{t('admin.newsletter.campaigns.subject')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.newsletter.campaigns.sentAt')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">{t('admin.newsletter.table.language')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.recipients')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.success')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.failed')}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id} className="border-border hover:bg-muted transition-colors">
                  <TableCell className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <div>{c.subject}</div>
                    <div className="text-xs text-muted-foreground sm:hidden tabular-nums">{c.sentAt ? format(new Date(c.sentAt), 'dd.MM.yyyy') : '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell cursor-pointer tabular-nums" onClick={() => setDetailId(c.id)}>{c.sentAt ? format(new Date(c.sentAt), 'dd.MM.yyyy HH:mm') : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground uppercase hidden lg:table-cell cursor-pointer" onClick={() => setDetailId(c.id)}>{c.language ?? t('admin.newsletter.compose.langAll')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell cursor-pointer tabular-nums" onClick={() => setDetailId(c.id)}>{c.recipientsCount}</TableCell>
                  <TableCell className="text-sm text-success hidden md:table-cell cursor-pointer tabular-nums" onClick={() => setDetailId(c.id)}>{c.successCount}</TableCell>
                  <TableCell className="text-sm text-destructive hidden md:table-cell cursor-pointer tabular-nums" onClick={() => setDetailId(c.id)}>{c.failureCount}</TableCell>
                  <TableCell className="cursor-pointer" onClick={() => setDetailId(c.id)}><StatusPill status={c.status} /></TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteCampaign.isPending}
                      aria-label={t('admin.common.delete')}
                      title={t('admin.common.delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(c.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Detail modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailCampaign?.subject}</DialogTitle>
            <DialogDescription>
              {detailCampaign?.sentAt ? format(new Date(detailCampaign.sentAt), 'dd.MM.yyyy HH:mm') : ''} · <StatusPill status={detailCampaign?.status ?? ''} />
            </DialogDescription>
          </DialogHeader>
          {detailCampaign?.bodyHtml && (
            <iframe
              srcDoc={detailCampaign.bodyHtml}
              sandbox=""
              className="w-full h-[400px] border border-border rounded bg-card"
              title={t('admin.newsletter.campaigns.bodyFrameTitle', 'Campaign body')}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDeleteCampaign(pendingDelete); setPendingDelete(null); }}
        title={t('admin.newsletter.campaigns.confirmDeleteTitle', 'Delete this campaign?')}
        description={t('admin.newsletter.campaigns.confirmDeleteDesc', 'This permanently removes the campaign record and its send history. This action cannot be undone.')}
      />
    </>
  );
}

// ── TAB 3: Subscribers (existing) ───────────────────────────────────────────

function SubscribersTab() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminSubscribers();
  const unsubscribe = useUnsubscribe();
  const subscribers = data?.items ?? [];
  const [pendingUnsub, setPendingUnsub] = useState<string | null>(null);

  const exportCsv = () => {
    const header = 'Email,Language,Subscribed,Active\n';
    const rows = subscribers
      .map(s => `${s.email},${s.language},${formatDate(s.subscribedAt, { year: 'numeric', month: '2-digit', day: '2-digit' })},${s.isActive}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('admin.newsletter.toast.exported'));
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribe.mutateAsync(id);
      toast.success(t('admin.newsletter.toast.removed'));
    } catch {
      toast.error(t('admin.newsletter.toast.removeFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportCsv} variant="outline" className="border-border text-foreground">
          <Download className="h-4 w-4 mr-2" />{t('admin.newsletter.exportCsv')}
        </Button>
      </div>
      {isError ? (
        <ErrorState
          description={t('admin.newsletter.loadError', 'Could not load subscribers. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : subscribers.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={t('admin.newsletter.emptyTitle', 'No subscribers yet')}
              description={t('admin.newsletter.empty')}
            />
          ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs">{t('admin.common.email')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.newsletter.table.language')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.newsletter.table.subscribed')}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map(s => (
                <TableRow key={s.id} className="border-border">
                  <TableCell className="text-sm text-foreground font-medium break-all">{s.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground uppercase hidden sm:table-cell">{s.language}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell tabular-nums">
                    {s.subscribedAt ? formatDate(s.subscribedAt) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${s.isActive ? 'bg-success/10 text-success border-success/30' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {s.isActive ? t('admin.newsletter.active') : t('admin.newsletter.unsubscribed')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setPendingUnsub(s.id)}
                      disabled={unsubscribe.isPending || !s.isActive}
                      aria-label={t('admin.newsletter.unsubscribe', 'Unsubscribe')}
                      title={t('admin.newsletter.unsubscribe', 'Unsubscribe')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          )}
        </CardContent>
      </Card>
      )}

      <ConfirmDialog
        open={!!pendingUnsub}
        onOpenChange={(o) => !o && setPendingUnsub(null)}
        onConfirm={() => { if (pendingUnsub) handleUnsubscribe(pendingUnsub); setPendingUnsub(null); }}
        title={t('admin.newsletter.confirmUnsubTitle', 'Unsubscribe this person?')}
        description={t('admin.newsletter.confirmUnsubDesc', 'They will stop receiving newsletters. You can re-add them later if needed.')}
        confirmLabel={t('admin.newsletter.unsubscribe', 'Unsubscribe')}
      />
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminNewsletter() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.newsletter.title')}
        subtitle={t('admin.newsletter.subtitle', 'Send email newsletters to subscribers. Use the Compose tab to write a campaign, then send a test to yourself before broadcasting.')}
      />

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">{t('admin.newsletter.tabs.compose')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('admin.newsletter.tabs.campaigns')}</TabsTrigger>
          <TabsTrigger value="subscribers">{t('admin.newsletter.tabs.subscribers')}</TabsTrigger>
        </TabsList>
        <TabsContent value="compose" className="mt-4"><ComposeTab /></TabsContent>
        <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
        <TabsContent value="subscribers" className="mt-4"><SubscribersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
