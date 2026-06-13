import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Loader2, Briefcase } from 'lucide-react';
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
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
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
  const { data: careers, isLoading, isError, refetch } = useAdminCareers();
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

  const inputClass = "border-border bg-card text-foreground focus:border-primary focus:ring-primary";
  const labelClass = "text-sm text-muted-foreground font-medium";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.careers.title')}
        subtitle={t('admin.careers.subtitle', 'Manage job postings shown on the careers page. Toggle Active to show or hide a posting without deleting it.')}
        action={
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            <Plus className="h-4 w-4 mr-2" />{t('admin.careers.addNew')}
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          description={t('admin.careers.loadError', 'Could not load job postings. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <TableSkeleton rows={6} cols={4} />
          </CardContent>
        </Card>
      ) : (careers ?? []).length === 0 ? (
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              icon={Briefcase}
              title={t('admin.careers.empty.title', 'No job postings yet')}
              description={t('admin.careers.empty.description', 'Create your first job posting to show it on the careers page.')}
              action={
                <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />{t('admin.careers.addNew')}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs">{t('admin.careers.table.title')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.careers.table.location')}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(careers ?? []).map(c => (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="text-sm text-foreground font-medium">
                    <div>{c.title}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{c.location}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.location && (
                      <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">{c.location}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${c.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {c.isActive ? t('admin.careers.active') : t('admin.careers.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(c)}
                        aria-label={t('admin.common.edit')}
                        title={t('admin.common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
      )}

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCareer ? t('admin.careers.editTitle') : t('admin.careers.newTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label className={labelClass}>{t('admin.careers.fields.active')}</Label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
              <p className="text-xs text-muted-foreground">
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
              <TabsList className="bg-muted border border-border">
                {langs.map(l => (
                  <TabsTrigger key={l} value={l} className="uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{l}</TabsTrigger>
                ))}
              </TabsList>
              {langs.map(lang => (
                <TabsContent key={lang} value={lang} className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label className={labelClass}>
                      {t('admin.careers.fields.title')}
                      {lang === 'et' && <span className="text-destructive ml-0.5">*</span>}
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
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
