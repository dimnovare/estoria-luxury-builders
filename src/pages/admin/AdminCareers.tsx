import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import TranslateButton from '@/components/admin/TranslateButton';
import {
  useAdminCareers,
  useCreateCareer,
  useUpdateCareer,
  useDeleteCareer,
  type AdminCareer,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { title: string; location: string; description: string; };
const emptyTrans: TransFields = { title: '', location: '', description: '' };

export default function AdminCareers() {
  const { t } = useTranslation();
  const { data: careers, isLoading } = useAdminCareers();
  const createCareer = useCreateCareer();
  const updateCareer = useUpdateCareer();
  const deleteCareer = useDeleteCareer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<AdminCareer | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  const openNew = () => {
    setEditingCareer(null);
    setActive(true);
    setTranslations({ et: { ...emptyTrans }, en: { ...emptyTrans }, ru: { ...emptyTrans } });
    setDialogOpen(true);
  };

  const openEdit = (c: AdminCareer) => {
    setEditingCareer(c);
    setActive(c.isActive);
    setTranslations({
      et: { ...emptyTrans },
      en: { title: c.title, location: c.location ?? '', description: '' },
      ru: { ...emptyTrans },
    });
    setDialogOpen(true);
  };

  const updateTrans = (lang: string, field: keyof TransFields, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handleSave = async () => {
    // DATA-LOSS GUARD: only send languages whose title was actually filled in.
    // The list endpoint can't hydrate ET/RU tabs, so sending blank translations
    // for the untouched languages would overwrite (wipe) existing rows on edit.
    const translationEntries = langs
      .filter(l => translations[l].title.trim() !== '')
      .map(l => [toBeLang(l), {
        title: translations[l].title,
        description: translations[l].description,
        location: translations[l].location || null,
      }]);
    const dto = {
      isActive: active,
      translations: Object.fromEntries(translationEntries),
    };

    try {
      if (editingCareer) {
        await updateCareer.mutateAsync({ id: editingCareer.id, dto });
        toast.success(t('admin.careers.toast.updated'));
      } else {
        await createCareer.mutateAsync(dto);
        toast.success(t('admin.careers.toast.added'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('admin.careers.toast.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCareer.mutateAsync(id);
      toast.success(t('admin.careers.toast.deleted'));
    } catch {
      toast.error(t('admin.careers.toast.deleteFailed'));
    }
  };

  const isSaving = createCareer.isPending || updateCareer.isPending;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.careers.title')}</h1>
          <p className="text-sm text-[hsl(0_0%_45%)] mt-1">Manage job postings shown on the /careers page. Toggle IsActive to show or hide a posting without deleting it.</p>
        </div>
        <Button onClick={openNew} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shrink-0">
          <Plus className="h-4 w-4 mr-2" />{t('admin.careers.addNew')}
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.careers.table.title')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.careers.table.location')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell>
                </TableRow>
              )}
              {!isLoading && (careers ?? []).map(c => (
                <TableRow key={c.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <div>{c.title}</div>
                    <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{c.location}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.location && (
                      <Badge variant="secondary" className="text-[10px] bg-[hsl(0_0%_93%)] text-[hsl(0_0%_40%)]">{c.location}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${c.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {c.isActive ? t('admin.careers.active') : t('admin.careers.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_15%)]"
                        onClick={() => openEdit(c)}
                        aria-label={t('admin.common.edit')}
                        title={t('admin.common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-red-600"
                        onClick={() => setPendingDelete(c.id)}
                        disabled={deleteCareer.isPending}
                        aria-label={t('admin.common.delete')}
                        title={t('admin.common.delete')}
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
        <DialogContent className="max-w-xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingCareer ? t('admin.careers.editTitle') : t('admin.careers.newTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label className={labelClass}>{t('admin.careers.fields.active')}</Label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[hsl(0_0%_92%)]">
              <p className="text-xs text-[hsl(0_0%_45%)]">
                {t('admin.careers.translateHint', 'Write the posting in Estonian, then translate the title, location and description to the other languages with one click. You can edit afterwards.')}
              </p>
              <TranslateButton
                to={['en', 'ru']}
                fields={{
                  title: translations.et?.title || '',
                  location: translations.et?.location || '',
                  description: translations.et?.description || '',
                }}
                onTranslated={(lang, f) => setTranslations(prev => ({
                  ...prev,
                  [lang]: { ...prev[lang], ...f },
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
                  <div className="space-y-2">
                    <Label className={labelClass}>
                      {t('admin.careers.fields.title')}
                      {lang === 'et' && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    <Input value={translations[lang]?.title || ''} onChange={e => updateTrans(lang, 'title', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.careers.fields.location')}</Label>
                    <Input value={translations[lang]?.location || ''} onChange={e => updateTrans(lang, 'location', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.careers.fields.description')}</Label>
                    <RichTextEditor value={translations[lang]?.description || ''} onChange={(html) => updateTrans(lang, 'description', html)} placeholder={t('admin.careers.fields.description')} minHeight="200px" />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('admin.careers.savePosition')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete);
          setPendingDelete(null);
        }}
        title={t('admin.careers.deleteTitle', 'Delete this job posting?')}
        description={t('admin.careers.deleteDesc', "This will permanently remove the posting and all its translations. This action can't be undone.")}
      />
    </div>
  );
}
