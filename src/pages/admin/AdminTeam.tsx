import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import TranslateButton from '@/components/admin/TranslateButton';
import { normalizeLanguages, languageLabel } from '@/lib/languages';
import {
  useAdminTeam,
  useAdminTeamMember,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useUploadTeamPhoto,
  useSetTeamMemberActive,
  type AdminTeamMember,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;
const allLanguages = [
  { value: 'Estonian', labelKey: 'admin.team.languages.estonian' },
  { value: 'English',  labelKey: 'admin.team.languages.english'  },
  { value: 'Russian',  labelKey: 'admin.team.languages.russian'  },
  { value: 'Finnish',  labelKey: 'admin.team.languages.finnish'  },
  { value: 'German',   labelKey: 'admin.team.languages.german'   },
  { value: 'French',   labelKey: 'admin.team.languages.french'   },
  { value: 'Swedish',  labelKey: 'admin.team.languages.swedish'  },
];

type TransFields = { name: string; role: string; bio: string; };
const emptyTrans: TransFields = { name: '', role: '', bio: '' };

export default function AdminTeam() {
  const { t } = useTranslation();
  const { data: team, isLoading } = useAdminTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const uploadPhoto = useUploadTeamPhoto();
  const setActive = useSetTeamMemberActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  // Hide-with-no-properties confirm + hide-with-transfer dialog state.
  const [pendingHide, setPendingHide] = useState<AdminTeamMember | null>(null);
  const [transferMember, setTransferMember] = useState<AdminTeamMember | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  // Detail fetch only fires when an id is set — null/undefined skips the call.
  const { data: editingDetail } = useAdminTeamMember(editingMember?.id);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  const openNew = () => {
    setEditingMember(null);
    setPhone('');
    setEmail('');
    setSortOrder('0');
    setSelectedLangs([]);
    setPhotoPreview('');
    setTranslations({ et: { ...emptyTrans }, en: { ...emptyTrans }, ru: { ...emptyTrans } });
    setDialogOpen(true);
  };

  const openEdit = (m: AdminTeamMember) => {
    // Seed common fields from the list row so the dialog opens instantly;
    // the detail fetch then fills in per-language Translations via the
    // useEffect below. Keeps the form responsive on slow connections.
    setEditingMember(m);
    setPhone(m.phone);
    setEmail(m.email);
    setSortOrder('0');
    setSelectedLangs(normalizeLanguages(m.languages));
    setPhotoPreview(m.photoUrl ?? '');
    setTranslations({ et: { ...emptyTrans }, en: { ...emptyTrans }, ru: { ...emptyTrans } });
    setDialogOpen(true);
  };

  // When the detail fetch resolves, hydrate the form from the full
  // translations dict. PascalCase keys ('Et'/'En'/'Ru') come straight from
  // the backend — map them back to lower-case for the form's local state.
  useEffect(() => {
    if (!editingMember || !editingDetail) return;

    setPhone(editingDetail.phone ?? '');
    setEmail(editingDetail.email ?? '');
    setSortOrder(String(editingDetail.sortOrder ?? 0));
    setSelectedLangs(normalizeLanguages(editingDetail.languages));
    setPhotoPreview(editingDetail.photoUrl ?? '');

    const next: Record<string, TransFields> = {
      et: { ...emptyTrans },
      en: { ...emptyTrans },
      ru: { ...emptyTrans },
    };
    for (const [k, v] of Object.entries(editingDetail.translations ?? {})) {
      const fe = k.toLowerCase();
      if (fe === 'et' || fe === 'en' || fe === 'ru') {
        next[fe] = {
          name: v.name ?? '',
          role: v.role ?? '',
          bio:  v.bio  ?? '',
        };
      }
    }
    setTranslations(next);
  }, [editingMember, editingDetail]);

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const updateTrans = (lang: string, field: keyof TransFields, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;
    try {
      const result = await uploadPhoto.mutateAsync({ id: editingMember.id, file });
      setPhotoPreview(result.url);
      toast.success(t('admin.team.toast.photoUploaded'));
    } catch {
      toast.error(t('admin.team.toast.photoUploadFailed'));
    }
  };

  const handleSave = async () => {
    // Estonian is the primary authoring language — the Estonian name is required.
    if (!translations.et?.name?.trim()) {
      toast.error(t('admin.team.validation.nameRequired', 'Eesti nimi on kohustuslik.'));
      return;
    }

    const dto = {
      photoUrl: photoPreview || null,
      phone,
      email,
      languages: selectedLangs,
      sortOrder: parseInt(sortOrder) || 0,
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), translations[l]])
      ),
    };

    try {
      if (editingMember) {
        await updateMember.mutateAsync({ id: editingMember.id, dto });
        toast.success(t('admin.team.toast.updated'));
      } else {
        await createMember.mutateAsync(dto);
        toast.success(t('admin.team.toast.added'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('admin.team.toast.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success(t('admin.team.toast.removed'));
    } catch {
      toast.error(t('admin.team.toast.removeFailed'));
    }
  };

  const handleShow = async (id: string) => {
    try {
      await setActive.mutateAsync({ id, isActive: true });
      toast.success(t('admin.team.toast.shown', 'Member is now visible.'));
    } catch {
      toast.error(t('admin.team.toast.visibilityFailed', 'Could not update visibility.'));
    }
  };

  // Hide is a two-step flow: a member holding properties must reassign them
  // first (transfer dialog), otherwise a plain confirm is enough.
  const handleHideClick = (m: AdminTeamMember) => {
    if (m.propertyCount > 0) {
      setTransferTo('');
      setTransferMember(m);
    } else {
      setPendingHide(m);
    }
  };

  const handleHideNoProps = async (id: string) => {
    try {
      await setActive.mutateAsync({ id, isActive: false });
      toast.success(t('admin.team.toast.hidden', 'Member hidden.'));
    } catch {
      toast.error(t('admin.team.toast.visibilityFailed', 'Could not update visibility.'));
    }
  };

  const handleHideTransfer = async () => {
    if (!transferMember || !transferTo) return;
    try {
      await setActive.mutateAsync({ id: transferMember.id, isActive: false, reassignToAgentId: transferTo });
      toast.success(t('admin.team.toast.hiddenTransferred', 'Member hidden; properties transferred.'));
      setTransferMember(null);
    } catch {
      toast.error(t('admin.team.toast.visibilityFailed', 'Could not update visibility.'));
    }
  };

  const isSaving = createMember.isPending || updateMember.isPending;
  const pendingName = (team ?? []).find(m => m.id === pendingDelete)?.name;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.team.title')}</h1>
          <p className="text-sm text-[hsl(0_0%_45%)] mt-1">{t('admin.team.subtitle', 'Manage team member profiles shown on the About page. Drag to reorder.')}</p>
        </div>
        <Button onClick={openNew} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shrink-0">
          <Plus className="h-4 w-4 mr-2" />{t('admin.team.addNew')}
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12 hidden sm:table-cell"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.team.table.name')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.team.table.role')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.team.table.languages')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.team.table.contact')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell>
                </TableRow>
              )}
              {!isLoading && (team ?? []).map(m => (
                <TableRow key={m.id} className={`border-[hsl(0_0%_93%)] ${m.isActive ? '' : 'opacity-60'}`}>
                  <TableCell className="hidden sm:table-cell">
                    <img src={m.photoUrl || '/placeholder.jpg'} alt="" className="h-9 w-9 rounded-full object-cover" />
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <div className="flex items-center gap-2">
                      <span>{m.name}</span>
                      {!m.isActive && (
                        <Badge variant="secondary" className="text-[10px] bg-[hsl(0_0%_90%)] text-[hsl(0_0%_45%)]">
                          {t('admin.team.hidden', 'Hidden')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{m.role}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden sm:table-cell">{m.role}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {normalizeLanguages(m.languages).map(l => (
                        <Badge key={l} variant="secondary" className="text-[10px] bg-[hsl(0_0%_93%)] text-[hsl(0_0%_40%)]">{languageLabel(l, t)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)] hidden lg:table-cell">{m.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]" onClick={() => openEdit(m)} title={t('admin.common.edit')} aria-label={t('admin.common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {m.isActive ? (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]"
                          onClick={() => handleHideClick(m)}
                          disabled={setActive.isPending}
                          title={t('admin.team.hide', 'Hide')}
                          aria-label={t('admin.team.hide', 'Hide')}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]"
                          onClick={() => handleShow(m.id)}
                          disabled={setActive.isPending}
                          title={t('admin.team.show', 'Show')}
                          aria-label={t('admin.team.show', 'Show')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-red-500"
                        onClick={() => setPendingDelete(m.id)}
                        disabled={deleteMember.isPending}
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

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingMember ? t('admin.team.editTitle') : t('admin.team.newTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Photo */}
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.team.fields.photo')}</Label>
              {photoPreview ? (
                <div className="flex items-center gap-3">
                  <img src={photoPreview} alt="" className="h-16 w-16 rounded-full object-cover border border-[hsl(0_0%_90%)]" />
                  <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]">
                    {t('admin.team.fields.change')}
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-4 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer"
                  onClick={() => editingMember && photoInputRef.current?.click()}
                >
                  <p className="text-sm text-[hsl(0_0%_50%)]">
                    {editingMember ? t('admin.team.fields.uploadPhoto') : t('admin.team.fields.saveFirst')}
                  </p>
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>{t('admin.team.fields.phone')}</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>{t('admin.team.fields.email')}</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.team.fields.sortOrder')}</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={`w-32 ${inputClass}`} />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.team.fields.spokenLanguages')}</Label>
              <div className="flex flex-wrap gap-3">
                {allLanguages.map(l => (
                  <label key={l.value} className="flex items-center gap-1.5 text-sm text-[hsl(0_0%_30%)]">
                    <Checkbox checked={selectedLangs.includes(l.value)} onCheckedChange={() => toggleLang(l.value)} />
                    {t(l.labelKey)}
                  </label>
                ))}
              </div>
            </div>

            {/* Translation tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[hsl(0_0%_92%)]">
              <p className="text-xs text-[hsl(0_0%_45%)]">
                {t('admin.team.translateHint', 'Write the role and bio in Estonian, then translate them to the other languages with one click. The name is copied as-is. You can edit afterwards.')}
              </p>
              <TranslateButton
                to={['en', 'ru']}
                fields={{
                  role: translations.et?.role || '',
                  bio: translations.et?.bio || '',
                }}
                onTranslated={(lang, f) => setTranslations(prev => ({
                  ...prev,
                  [lang]: {
                    ...prev[lang],
                    ...f,
                    // A team member's name is a person's name — identical across
                    // languages — so copy it verbatim from Estonian, don't translate.
                    name: prev.et?.name ?? prev[lang]?.name ?? '',
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className={labelClass}>
                        {t('admin.team.fields.name')}
                        {lang === 'et' && <span className="text-red-500 ml-0.5">*</span>}
                      </Label>
                      {lang !== 'et' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto py-0.5 px-2 text-xs text-[hsl(43_50%_44%)] hover:text-[hsl(43_50%_38%)] hover:bg-transparent"
                          onClick={() => updateTrans(lang, 'name', translations.et?.name ?? '')}
                        >
                          {t('admin.team.fields.copyFromEstonian', 'Copy from Estonian')}
                        </Button>
                      )}
                    </div>
                    <Input value={translations[lang]?.name || ''} onChange={e => updateTrans(lang, 'name', e.target.value)} className={inputClass} />
                    {lang === 'et' && (
                      <p className="text-xs text-[hsl(0_0%_55%)]">{t('admin.team.fields.estonianRequired', 'The Estonian name is required.')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.team.fields.role')}</Label>
                    <Input value={translations[lang]?.role || ''} onChange={e => updateTrans(lang, 'role', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.team.fields.bio')}</Label>
                    <RichTextEditor
                      value={translations[lang]?.bio ?? ''}
                      onChange={(html) => updateTrans(lang, 'bio', html)}
                      placeholder={t('admin.team.fields.bioPlaceholder', 'Team member biography...')}
                      minHeight="150px"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('admin.team.saveMember')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description={pendingName
          ? t('admin.team.confirmDeleteDesc', 'Remove "{{name}}" from the team? This action can\'t be undone.', { name: pendingName })
          : undefined}
      />

      {/* Hide a member who has no properties — a plain confirm is enough. */}
      <ConfirmDialog
        open={!!pendingHide}
        onOpenChange={(o) => !o && setPendingHide(null)}
        onConfirm={() => { if (pendingHide) handleHideNoProps(pendingHide.id); setPendingHide(null); }}
        destructive={false}
        confirmLabel={t('admin.team.hide', 'Hide')}
        title={pendingHide
          ? t('admin.team.confirmHideTitle', 'Hide {{name}}?', { name: pendingHide.name })
          : undefined}
        description={t('admin.team.confirmHideDesc', 'They will no longer appear on the site.')}
      />

      {/* Hide a member who still holds properties — force a reassignment first. */}
      <Dialog open={!!transferMember} onOpenChange={(o) => { if (!o) setTransferMember(null); }}>
        <DialogContent className="max-w-md bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {transferMember
                ? t('admin.team.transfer.title', 'Hide {{name}}?', { name: transferMember.name })
                : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[hsl(0_0%_45%)]">
              {transferMember
                ? t('admin.team.transfer.body', '{{name}} has {{count}} properties. Choose an agent to receive them:', { name: transferMember.name, count: transferMember.propertyCount })
                : ''}
            </p>
            <div className="space-y-2">
              <Label className={labelClass}>{t('admin.team.transfer.agent', 'Receiving agent')}</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t('admin.team.transfer.selectAgent', 'Select an agent…')} />
                </SelectTrigger>
                <SelectContent>
                  {(team ?? [])
                    .filter(m => m.isActive && m.id !== transferMember?.id)
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setTransferMember(null)}
              className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]"
            >
              {t('admin.common.cancel')}
            </Button>
            <Button
              onClick={handleHideTransfer}
              disabled={!transferTo || setActive.isPending}
              className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]"
            >
              {setActive.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('admin.team.transfer.confirm', 'Hide & transfer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
