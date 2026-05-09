import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Trash2, Eye, Send, TestTube2, RotateCcw } from 'lucide-react';
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

import { useAdminSubscribers, useUnsubscribe } from '@/hooks/api/useAdmin';
import { useNewsletterCampaigns, useSendNewsletterNow, useNewsletterSubscriberCount, type CampaignDto } from '@/hooks/api/useNewsletter';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/api/useSiteSettings';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { format } from 'date-fns';

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
    status === 'Sent' ? 'bg-green-100 text-green-700 border-green-200' :
    status === 'Sending' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
    status === 'Failed' ? 'bg-red-100 text-red-700 border-red-200' :
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
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_45%)]">{t('admin.newsletter.compose.subject')}</FormLabel>
                  <FormControl><Input {...field} className="bg-[hsl(0_0%_97%)] border-[hsl(0_0%_88%)] text-[hsl(0_0%_15%)] placeholder:text-[hsl(0_0%_55%)]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_45%)]">{t('admin.newsletter.compose.languageFilter')}</FormLabel>
                  <Select value={field.value ?? 'all'} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-[hsl(0_0%_97%)] border-[hsl(0_0%_88%)] text-[hsl(0_0%_15%)]">
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
                  <FormLabel className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_45%)]">{t('admin.newsletter.compose.body')}</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('admin.newsletter.compose.body')}
                      minHeight="320px"
                    />
                  </FormControl>
                  <p className="text-xs text-[hsl(0_0%_50%)]">{t('admin.newsletter.compose.bodyHelp')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_50%)]">
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                {t('admin.newsletter.compose.willReach', { count: recipientCount })}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={sendMut.isPending}>
                <Send className="h-4 w-4 mr-2" />{t('admin.newsletter.compose.sendNow')}
              </Button>
              <Button type="button" variant="outline" className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)]" onClick={onSendTest} disabled={sendMut.isPending}>
                <TestTube2 className="h-4 w-4 mr-2" />{t('admin.newsletter.compose.sendTest')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right — preview */}
      <div className="space-y-2">
        <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs text-[hsl(0_0%_50%)] space-y-1">
              <p><span className="font-medium">{t('admin.newsletter.compose.from')}:</span> {fromEmail}</p>
              <p><span className="font-medium">{t('admin.newsletter.compose.to')}:</span> {recipientCount} {t('admin.newsletter.compose.subscribers')}</p>
            </div>
            {debouncedBody ? (
              <iframe
                srcDoc={debouncedBody}
                sandbox=""
                className="w-full max-h-[600px] border border-[hsl(0_0%_90%)] rounded bg-white"
                style={{ minHeight: 200 }}
                title="Preview"
              />
            ) : (
              <div className="h-[200px] bg-[hsl(0_0%_96%)] rounded flex items-center justify-center text-sm text-[hsl(0_0%_60%)]">
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
  const { data, isLoading } = useNewsletterCampaigns(page);
  const campaigns = data?.items ?? [];
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailCampaign = campaigns.find(c => c.id === detailId);

  return (
    <>
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.newsletter.campaigns.subject')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.newsletter.campaigns.sentAt')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.newsletter.table.language')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.recipients')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.success')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.newsletter.campaigns.failed')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-[hsl(0_0%_50%)]">{t('admin.common.loading')}</TableCell></TableRow>
              )}
              {!isLoading && campaigns.map(c => (
                <TableRow key={c.id} className="border-[hsl(0_0%_93%)] cursor-pointer hover:bg-[hsl(0_0%_97%)]" onClick={() => setDetailId(c.id)}>
                  <TableCell className="text-sm font-medium text-[hsl(0_0%_20%)]">
                    <div>{c.subject}</div>
                    <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{c.sentAt ? format(new Date(c.sentAt), 'dd.MM.yyyy') : '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden sm:table-cell">{c.sentAt ? format(new Date(c.sentAt), 'dd.MM.yyyy HH:mm') : '—'}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] uppercase hidden lg:table-cell">{c.language ?? t('admin.newsletter.compose.langAll')}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{c.recipientsCount}</TableCell>
                  <TableCell className="text-sm text-green-600 hidden md:table-cell">{c.successCount}</TableCell>
                  <TableCell className="text-sm text-red-500 hidden md:table-cell">{c.failureCount}</TableCell>
                  <TableCell><StatusPill status={c.status} /></TableCell>
                </TableRow>
              ))}
              {!isLoading && campaigns.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-[hsl(0_0%_50%)]">{t('admin.newsletter.campaigns.empty')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

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
              className="w-full h-[400px] border border-[hsl(0_0%_90%)] rounded bg-white"
              title="Campaign body"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── TAB 3: Subscribers (existing) ───────────────────────────────────────────

function SubscribersTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminSubscribers();
  const unsubscribe = useUnsubscribe();
  const subscribers = data?.items ?? [];

  const exportCsv = () => {
    const header = 'Email,Language,Subscribed,Active\n';
    const rows = subscribers
      .map(s => `${s.email},${s.language},${new Date(s.subscribedAt).toLocaleDateString()},${s.isActive}`)
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
        <Button onClick={exportCsv} variant="outline" className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)]">
          <Download className="h-4 w-4 mr-2" />{t('admin.newsletter.exportCsv')}
        </Button>
      </div>
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.email')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.newsletter.table.language')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.newsletter.table.subscribed')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell></TableRow>
              )}
              {!isLoading && subscribers.map(s => (
                <TableRow key={s.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium break-all">{s.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] uppercase hidden sm:table-cell">{s.language}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)] hidden sm:table-cell">
                    {s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${s.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {s.isActive ? t('admin.newsletter.active') : t('admin.newsletter.unsubscribed')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                      onClick={() => handleUnsubscribe(s.id)}
                      disabled={unsubscribe.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && subscribers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.newsletter.empty')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminNewsletter() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.newsletter.title')}</h1>

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
