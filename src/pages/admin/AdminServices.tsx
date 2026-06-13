import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, GripVertical, Trash2, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import TranslateButton from '@/components/admin/TranslateButton';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  useAdminServices,
  useAdminService,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useReorderServices,
  type AdminService,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { name: string; description: string; priceInfo: string; };
const emptyTrans: TransFields = { name: '', description: '', priceInfo: '' };

export default function AdminServices() {
  const { t } = useTranslation();
  const { data: services, isLoading } = useAdminServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const reorderServices = useReorderServices();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const { data: editingDetail } = useAdminService(editingService?.id);
  const [iconName, setIconName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  const openNew = () => {
    setEditingService(null);
    setIconName('');
    setSortOrder('0');
    setTranslations({ et: { ...emptyTrans }, en: { ...emptyTrans }, ru: { ...emptyTrans } });
    setDialogOpen(true);
  };

  const openEdit = (s: AdminService) => {
    // Open instantly with the list-row values; the detail fetch hydrates
    // the per-language Translations dict via the useEffect below.
    setEditingService(s);
    setIconName(s.iconName ?? '');
    setSortOrder('0');
    setTranslations({ et: { ...emptyTrans }, en: { ...emptyTrans }, ru: { ...emptyTrans } });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!editingService || !editingDetail) return;

    setIconName(editingDetail.iconName ?? '');
    setSortOrder(String(editingDetail.sortOrder ?? 0));

    const next: Record<string, TransFields> = {
      et: { ...emptyTrans },
      en: { ...emptyTrans },
      ru: { ...emptyTrans },
    };
    for (const [k, v] of Object.entries(editingDetail.translations ?? {})) {
      const fe = k.toLowerCase();
      if (fe === 'et' || fe === 'en' || fe === 'ru') {
        next[fe] = {
          name:        v.name        ?? '',
          description: v.description ?? '',
          priceInfo:   v.priceInfo   ?? '',
        };
      }
    }
    setTranslations(next);
  }, [editingService, editingDetail]);

  const updateTrans = (lang: string, field: keyof TransFields, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handleSave = async () => {
    // Estonian is the primary authoring language — require the Estonian name.
    if (!translations.et?.name?.trim()) {
      toast.error(t('admin.services.validation.nameRequired', 'Eestikeelne nimi on kohustuslik.'));
      return;
    }

    const dto = {
      iconName: iconName || null,
      sortOrder: parseInt(sortOrder) || 0,
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), translations[l]])
      ),
    };

    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, dto });
        toast.success(t('admin.services.toast.updated'));
      } else {
        await createService.mutateAsync(dto);
        toast.success(t('admin.services.toast.added'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('admin.services.toast.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast.success(t('admin.services.toast.deleted'));
    } catch {
      toast.error(t('admin.services.toast.deleteFailed'));
    }
  };

  const isSaving = createService.isPending || updateService.isPending;
  const pendingName = (services ?? []).find(s => s.id === pendingDelete)?.name;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.services.title')}
        subtitle={t('admin.services.subtitle', 'Edit the services shown on the homepage and services page. Type an icon name (for example home, key, building2 or scale) in the icon field.')}
        action={
          <Button onClick={openNew} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shrink-0">
            <Plus className="h-4 w-4 mr-2" />{t('admin.services.addNew')}
          </Button>
        }
      />

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-8 hidden sm:table-cell"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.services.table.icon')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.services.table.name')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.services.table.priceInfo')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell>
                </TableRow>
              )}
              {!isLoading && (services ?? []).map(s => (
                <TableRow
                  key={s.id}
                  draggable
                  onDragStart={() => setDragId(s.id)}
                  onDragOver={(e) => { e.preventDefault(); if (dragId && dragId !== s.id) setOverId(s.id); }}
                  onDragLeave={() => { if (overId === s.id) setOverId(null); }}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  onDrop={() => {
                    const list = services ?? [];
                    if (!dragId || dragId === s.id) { setDragId(null); setOverId(null); return; }
                    const items = [...list];
                    const fromIdx = items.findIndex(x => x.id === dragId);
                    const toIdx = items.findIndex(x => x.id === s.id);
                    if (fromIdx < 0 || toIdx < 0) { setDragId(null); setOverId(null); return; }
                    const [moved] = items.splice(fromIdx, 1);
                    items.splice(toIdx, 0, moved);
                    reorderServices.mutate(items.map((it, i) => ({ id: it.id, sortOrder: i })));
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={`border-[hsl(0_0%_93%)] transition-all ${dragId === s.id ? 'opacity-50' : ''} ${overId === s.id ? 'border-t-2 border-t-[hsl(43_50%_54%)]' : ''}`}
                >
                  {/* Functional drag handle: dragging a row reorders services (see onDrop → reorderServices.mutate). */}
                  <TableCell className="hidden sm:table-cell"><GripVertical className="h-4 w-4 text-[hsl(0_0%_60%)] cursor-grab active:cursor-grabbing" aria-label={t('admin.services.dragToReorder', 'Drag to reorder')} role="img" /></TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden sm:table-cell">{s.iconName || '—'}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <div>{s.name}</div>
                    <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{s.priceInfo || ''}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)] hidden sm:table-cell">{s.priceInfo || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]" onClick={() => openEdit(s)} title={t('admin.common.edit')} aria-label={t('admin.common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-red-500"
                        onClick={() => setPendingDelete(s.id)}
                        disabled={deleteService.isPending}
                        title={t('admin.common.delete')}
                        aria-label={t('admin.common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-xl bg-white border-[hsl(0_0%_90%)] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingService ? t('admin.services.editTitle') : t('admin.services.newTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>{t('admin.services.fields.iconName')}</Label>
                <Input value={iconName} onChange={e => setIconName(e.target.value)} placeholder="Building2" className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>{t('admin.services.fields.sortOrder')}</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[hsl(0_0%_92%)]">
              <p className="text-xs text-[hsl(0_0%_45%)]">
                {t('admin.services.translateHint', 'Write the service in Estonian, then translate the name and description to the other languages with one click. You can edit afterwards.')}
              </p>
              <TranslateButton
                to={['en', 'ru']}
                fields={{
                  name: translations.et?.name || '',
                  description: translations.et?.description || '',
                }}
                onTranslated={(lang, f) => setTranslations(prev => ({
                  ...prev,
                  [lang]: {
                    ...prev[lang],
                    ...f,
                    // Prices/currency aren't localised — copy priceInfo verbatim from Estonian.
                    priceInfo: prev.et?.priceInfo ?? prev[lang]?.priceInfo ?? '',
                  },
                }))}
              />
            </div>

            <Tabs defaultValue="et">
              <TabsList className="bg-[hsl(0_0%_96%)] border border-[hsl(0_0%_90%)]">
                {langs.map(l => (
                  <TabsTrigger key={l} value={l} className="uppercase text-xs data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{l}</TabsTrigger>
                ))}
              </TabsList>
              {langs.map(lang => (
                <TabsContent key={lang} value={lang} className="mt-3 space-y-3">
                  {lang !== 'et' && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]"
                        onClick={() => setTranslations(prev => ({
                          ...prev,
                          [lang]: {
                            ...prev[lang],
                            name: prev.et?.name ?? '',
                            description: prev.et?.description ?? '',
                            priceInfo: prev.et?.priceInfo ?? '',
                          },
                        }))}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> {t('admin.services.copyFromEt', 'Copy from Estonian')}
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.services.fields.name')} {lang === 'et' && <span className="text-[hsl(43_50%_45%)]" title={t('admin.common.required', 'Required')}>*</span>}</Label>
                    <Input value={translations[lang]?.name || ''} onChange={e => updateTrans(lang, 'name', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.services.fields.description')}</Label>
                    <RichTextEditor
                      value={translations[lang]?.description ?? ''}
                      onChange={(html) => updateTrans(lang, 'description', html)}
                      placeholder={t('admin.services.fields.descriptionPlaceholder', 'Service description...')}
                      minHeight="160px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.services.fields.priceInfo')}</Label>
                    <Input value={translations[lang]?.priceInfo || ''} onChange={e => updateTrans(lang, 'priceInfo', e.target.value)} className={inputClass} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-[hsl(0_0%_92%)] shrink-0 bg-white">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('admin.services.saveService')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description={pendingName
          ? t('admin.services.confirmDeleteDesc', 'Delete the "{{name}}" service? This action can\'t be undone.', { name: pendingName })
          : undefined}
      />
    </div>
  );
}
