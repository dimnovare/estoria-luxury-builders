import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminTeam,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useUploadTeamPhoto,
  type AdminTeamMember,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;
const allLanguages = ['Estonian', 'English', 'Russian', 'Finnish', 'German', 'French', 'Swedish'];

type TransFields = { name: string; role: string; bio: string; };
const emptyTrans: TransFields = { name: '', role: '', bio: '' };

export default function AdminTeam() {
  const { data: team, isLoading } = useAdminTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const uploadPhoto = useUploadTeamPhoto();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
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
    setEditingMember(m);
    setPhone(m.phone);
    setEmail(m.email);
    setSortOrder('0');
    setSelectedLangs(m.languages ?? []);
    setPhotoPreview(m.photoUrl ?? '');
    setTranslations({
      et: { ...emptyTrans },
      en: { name: m.name, role: m.role, bio: '' },
      ru: { ...emptyTrans },
    });
    setDialogOpen(true);
  };

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
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    }
  };

  const handleSave = async () => {
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
        toast.success('Member updated');
      } else {
        await createMember.mutateAsync(dto);
        toast.success('Member added');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save member');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const isSaving = createMember.isPending || updateMember.isPending;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Team Members</h1>
        <Button onClick={openNew} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Plus className="h-4 w-4 mr-2" />Add Member
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Name</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Role</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Languages</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Contact</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && (team ?? []).map(m => (
                <TableRow key={m.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell>
                    <img src={m.photoUrl || '/placeholder.jpg'} alt="" className="h-9 w-9 rounded-full object-cover" />
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{m.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(m.languages ?? []).map(l => (
                        <Badge key={l} variant="secondary" className="text-[10px] bg-[hsl(0_0%_93%)] text-[hsl(0_0%_40%)]">{l}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)]">{m.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleteMember.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingMember ? 'Edit Member' : 'New Team Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Photo */}
            <div className="space-y-2">
              <Label className={labelClass}>Photo</Label>
              {photoPreview ? (
                <div className="flex items-center gap-3">
                  <img src={photoPreview} alt="" className="h-16 w-16 rounded-full object-cover border border-[hsl(0_0%_90%)]" />
                  <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]">
                    Change
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-4 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer"
                  onClick={() => editingMember && photoInputRef.current?.click()}
                >
                  <p className="text-sm text-[hsl(0_0%_50%)]">
                    {editingMember ? 'Upload photo' : 'Save member first to upload photo'}
                  </p>
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={`w-32 ${inputClass}`} />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Spoken Languages</Label>
              <div className="flex flex-wrap gap-3">
                {allLanguages.map(l => (
                  <label key={l} className="flex items-center gap-1.5 text-sm text-[hsl(0_0%_30%)]">
                    <Checkbox checked={selectedLangs.includes(l)} onCheckedChange={() => toggleLang(l)} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Translation tabs */}
            <Tabs defaultValue="et">
              <TabsList className="bg-[hsl(0_0%_96%)] border border-[hsl(0_0%_90%)]">
                {langs.map(l => (
                  <TabsTrigger key={l} value={l} className="uppercase text-xs data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{l}</TabsTrigger>
                ))}
              </TabsList>
              {langs.map(lang => (
                <TabsContent key={lang} value={lang} className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label className={labelClass}>Name</Label>
                    <Input value={translations[lang]?.name || ''} onChange={e => updateTrans(lang, 'name', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Role</Label>
                    <Input value={translations[lang]?.role || ''} onChange={e => updateTrans(lang, 'role', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Bio</Label>
                    <Textarea rows={4} value={translations[lang]?.bio || ''} onChange={e => updateTrans(lang, 'bio', e.target.value)} className={inputClass} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
