import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cake, Gift, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/admin/EmptyState';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  useUpcomingBirthdays, useBirthdayTemplates, useBirthdayAutoSend,
  useSendBirthdayNow, useSaveBirthdayTemplate, useSetBirthdayAutoSend,
  type BirthdayTemplateTranslation, type BirthdayLanguage,
} from '@/hooks/api/useBirthday';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';

// PascalCase to match the server's Language enum string. Don't lowercase
// these — the API rejects unknown values.
const TEMPLATE_LANGS: BirthdayLanguage[] = ['Et', 'En', 'Ru'];

export default function AdminBirthdays() {
  const { t } = useTranslation();

  const { data: birthdays, isLoading: loadingBirthdays } = useUpcomingBirthdays(30);
  const { data: templates, isLoading: loadingTemplates } = useBirthdayTemplates();
  const { data: autoSendEnabled, isLoading: loadingAutoSend } = useBirthdayAutoSend();

  const sendNow = useSendBirthdayNow();
  const saveTemplate = useSaveBirthdayTemplate();
  const setAutoSend = useSetBirthdayAutoSend();

  // Contact pending a "send birthday email now" confirmation. Sending goes to a
  // real client, so it must always be confirmed first.
  const [sendConfirm, setSendConfirm] = useState<{ contactId: string; name: string } | null>(null);

  // Template editing state
  const [templateLang, setTemplateLang] = useState<BirthdayLanguage>('Et');
  const [editedTemplates, setEditedTemplates] = useState<Record<BirthdayLanguage, BirthdayTemplateTranslation>>(
    {} as Record<BirthdayLanguage, BirthdayTemplateTranslation>
  );

  // Populate template editing from server data
  const getTemplate = (lang: BirthdayLanguage): BirthdayTemplateTranslation => {
    if (editedTemplates[lang]) return editedTemplates[lang];
    const server = templates?.find(t => t.language === lang);
    return server ?? { language: lang, subject: '', bodyHtml: '' };
  };

  const updateTemplate = (lang: BirthdayLanguage, field: 'subject' | 'bodyHtml', value: string) => {
    const current = getTemplate(lang);
    setEditedTemplates(prev => ({ ...prev, [lang]: { ...current, [field]: value } }));
  };

  const handleSaveTemplate = async (lang: BirthdayLanguage) => {
    const tpl = getTemplate(lang);
    try {
      await saveTemplate.mutateAsync(tpl);
      toast.success(t('admin.birthday.toast.templateSaved'));
    } catch {
      toast.error(t('admin.birthday.toast.templateSaveFailed'));
    }
  };

  const handleSendNow = async (contactId: string) => {
    try {
      await sendNow.mutateAsync(contactId);
      toast.success(t('admin.birthday.toast.sent'));
    } catch {
      toast.error(t('admin.birthday.toast.sendFailed'));
    }
  };

  // Group birthdays by week
  const grouped = useMemo(() => {
    if (!birthdays?.length) return [];
    const now = new Date();
    const weeks: { label: string; items: typeof birthdays }[] = [];
    for (let w = 0; w < 5; w++) {
      const weekStart = startOfWeek(addWeeks(now, w), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(addWeeks(now, w), { weekStartsOn: 1 });
      const items = birthdays.filter(b => {
        const bd = parseISO(b.nextBirthday);
        return isWithinInterval(bd, { start: weekStart, end: weekEnd });
      });
      if (items.length > 0) {
        weeks.push({
          label: w === 0
            ? t('admin.birthday.thisWeek')
            : `${format(weekStart, 'dd.MM')} – ${format(weekEnd, 'dd.MM')}`,
          items,
        });
      }
    }
    return weeks;
  }, [birthdays, t]);

  const currentTemplate = getTemplate(templateLang);

  return (
    <div className="space-y-8">
      <AdminPageHeader title={t('admin.birthday.title')} />

      {/* Section A — Upcoming Birthdays */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cake className="h-5 w-5 text-[hsl(43_50%_54%)]" />
            {t('admin.birthday.upcoming')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBirthdays ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[hsl(43_50%_54%)]" /></div>
          ) : grouped.length === 0 ? (
            <EmptyState icon={Gift} title={t('admin.birthday.noBirthdays')} />
          ) : (
            <div className="space-y-6">
              {grouped.map(week => (
                <div key={week.label}>
                  <h3 className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_50%)] mb-2">{week.label}</h3>
                  <div className="space-y-2">
                    {week.items.map(b => {
                      const daysUntil = b.daysUntil;
                      return (
                        <div key={b.contactId} className="flex items-center justify-between py-2 px-3 rounded-md bg-[hsl(0_0%_98%)] border border-[hsl(0_0%_93%)]">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[hsl(43_50%_54%)]/10 flex items-center justify-center">
                              <Cake className="h-4 w-4 text-[hsl(43_50%_54%)]" />
                            </div>
                            <div>
                              <Link to={`/admin/contacts/${b.contactId}`} className="text-sm font-medium text-[hsl(0_0%_20%)] hover:text-[hsl(43_50%_54%)]">
                                {b.fullName}
                              </Link>
                              <p className="text-xs text-[hsl(0_0%_50%)]">
                                {t('admin.birthday.turningAge', { age: b.turningAge })} · {format(parseISO(b.nextBirthday), 'dd.MM')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {daysUntil <= 0 && (
                              <Badge className="bg-[hsl(43_50%_54%)]/20 text-[hsl(43_50%_44%)] text-[10px]">{t('admin.birthday.today')}</Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_54%)]/5"
                              onClick={() => setSendConfirm({ contactId: b.contactId, name: b.fullName })}
                              disabled={sendNow.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />{t('admin.birthday.sendNow')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B — Template Editor */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.birthday.templateEditor')}</CardTitle>
          <p className="text-xs text-[hsl(0_0%_50%)] mt-1">
            {t('admin.birthday.variablesHint')}: <code className="bg-[hsl(0_0%_95%)] px-1 rounded">{'{{firstName}}'}</code>, <code className="bg-[hsl(0_0%_95%)] px-1 rounded">{'{{fullName}}'}</code>, <code className="bg-[hsl(0_0%_95%)] px-1 rounded">{'{{age}}'}</code>
          </p>
        </CardHeader>
        <CardContent>
          {loadingTemplates ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[hsl(43_50%_54%)]" /></div>
          ) : (
            <Tabs value={templateLang} onValueChange={(v) => setTemplateLang(v as BirthdayLanguage)}>
              <TabsList className="bg-[hsl(0_0%_95%)]">
                {TEMPLATE_LANGS.map(l => (
                  <TabsTrigger key={l} value={l}>{l.toUpperCase()}</TabsTrigger>
                ))}
              </TabsList>
              {TEMPLATE_LANGS.map(lang => (
                <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.birthday.fields.subject')}</Label>
                    <Input
                      value={getTemplate(lang).subject}
                      onChange={(e) => updateTemplate(lang, 'subject', e.target.value)}
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.birthday.fields.bodyHtml')}</Label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={getTemplate(lang).bodyHtml}
                        onChange={(html) => updateTemplate(lang, 'bodyHtml', html)}
                        placeholder={t('admin.birthday.fields.bodyPlaceholder', 'Birthday email body...')}
                        minHeight="200px"
                      />
                    </div>
                  </div>
                  <Button
                    className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]"
                    onClick={() => handleSaveTemplate(lang)}
                    disabled={saveTemplate.isPending}
                  >
                    {t('admin.common.save')}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Section C — Auto-send toggle */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-[hsl(0_0%_20%)]">{t('admin.birthday.autoSend')}</h3>
              <p className="text-xs text-[hsl(0_0%_50%)] mt-1">{t('admin.birthday.autoSendDescription')}</p>
            </div>
            <Switch
              checked={autoSendEnabled ?? false}
              onCheckedChange={(checked) => {
                setAutoSend.mutate(checked, {
                  onSuccess: () => toast.success(t('admin.birthday.toast.autoSendUpdated')),
                  onError: () => toast.error(t('admin.birthday.toast.autoSendFailed')),
                });
              }}
              disabled={loadingAutoSend || setAutoSend.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirm before sending a real birthday email to a client */}
      <ConfirmDialog
        open={!!sendConfirm}
        onOpenChange={(o) => !o && setSendConfirm(null)}
        onConfirm={() => { if (sendConfirm) handleSendNow(sendConfirm.contactId); setSendConfirm(null); }}
        title={t('admin.birthday.confirmSendTitle', 'Send birthday email now?')}
        description={sendConfirm
          ? t('admin.birthday.confirmSendDesc', 'A birthday email will be sent immediately to {{name}}. This cannot be unsent.', { name: sendConfirm.name })
          : ''}
        confirmLabel={t('admin.birthday.sendNow')}
        destructive={false}
      />
    </div>
  );
}
