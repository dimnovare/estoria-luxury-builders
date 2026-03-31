import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { data: careers, isLoading } = useAdminCareers();
  const createCareer = useCreateCareer();
  const updateCareer = useUpdateCareer();
  const deleteCareer = useDeleteCareer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<AdminCareer | null>(null);
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
    const dto = {
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), { title: translations[l].title, description: translations[l].description, location: translations[l].location || null }])
      ),
    };

    try {
      if (editingCareer) {
        await updateCareer.mutateAsync({ id: editingCareer.id, dto });
        toast.success('Position updated');
      } else {
        await createCareer.mutateAsync(dto);
        toast.success('Position added');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save position');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCareer.mutateAsync(id);
      toast.success('Position deleted');
    } catch {
      toast.error('Failed to delete position');
    }
  };

  const isSaving = createCareer.isPending || updateCareer.isPending;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Careers</h1>
        <Button onClick={openNew} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Plus className="h-4 w-4 mr-2" />Add Position
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Title</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Location</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Status</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && (careers ?? []).map(c => (
                <TableRow key={c.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{c.title}</TableCell>
                  <TableCell>
                    {c.location && (
                      <Badge variant="secondary" className="text-[10px] bg-[hsl(0_0%_93%)] text-[hsl(0_0%_40%)]">{c.location}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${c.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                        onClick={() => handleDelete(c.id)}
                        disabled={deleteCareer.isPending}
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

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingCareer ? 'Edit Position' : 'New Position'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label className={labelClass}>Active</Label>
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
                    <Label className={labelClass}>Title</Label>
                    <Input value={translations[lang]?.title || ''} onChange={e => updateTrans(lang, 'title', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Location</Label>
                    <Input value={translations[lang]?.location || ''} onChange={e => updateTrans(lang, 'location', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Description (HTML)</Label>
                    <Textarea rows={8} value={translations[lang]?.description || ''} onChange={e => updateTrans(lang, 'description', e.target.value)} className={inputClass} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Position
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
