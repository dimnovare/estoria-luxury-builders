import { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminPages, useUpdatePage, type AdminPage, toBeLang, toFeLang } from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { title: string; body: string; imageUrl: string; videoUrl: string; };
const emptyTrans: TransFields = { title: '', body: '', imageUrl: '', videoUrl: '' };

function pageLabel(key: string) {
  return key
    .split('.')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' – ');
}

export default function AdminPages() {
  const { data: pages, isLoading } = useAdminPages();
  const updatePage = useUpdatePage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<AdminPage | null>(null);
  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  const openEdit = (page: AdminPage) => {
    setEditingPage(page);
    setTranslations({
      et: {
        title: page.translations['Et']?.title ?? '',
        body: page.translations['Et']?.body ?? '',
        imageUrl: page.translations['Et']?.imageUrl ?? '',
        videoUrl: page.translations['Et']?.videoUrl ?? '',
      },
      en: {
        title: page.translations['En']?.title ?? '',
        body: page.translations['En']?.body ?? '',
        imageUrl: page.translations['En']?.imageUrl ?? '',
        videoUrl: page.translations['En']?.videoUrl ?? '',
      },
      ru: {
        title: page.translations['Ru']?.title ?? '',
        body: page.translations['Ru']?.body ?? '',
        imageUrl: page.translations['Ru']?.imageUrl ?? '',
        videoUrl: page.translations['Ru']?.videoUrl ?? '',
      },
    });
    setDialogOpen(true);
  };

  const updateTrans = (lang: string, field: keyof TransFields, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handleSave = async () => {
    if (!editingPage) return;
    const dto = {
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), {
          title: translations[l].title || null,
          body: translations[l].body || null,
          imageUrl: translations[l].imageUrl || null,
          videoUrl: translations[l].videoUrl || null,
        }])
      ),
    };

    try {
      await updatePage.mutateAsync({ id: editingPage.id, dto });
      toast.success('Page content saved');
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save page content');
    }
  };

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Pages</h1>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Key</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Label</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && (pages ?? []).map(p => (
                <TableRow key={p.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] font-mono">{p.pageKey}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{pageLabel(p.pageKey)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">
              {editingPage ? pageLabel(editingPage.pageKey) : ''}
            </DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
                      <Label className={labelClass}>Body</Label>
                      <Textarea rows={6} value={translations[lang]?.body || ''} onChange={e => updateTrans(lang, 'body', e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Image URL</Label>
                      <Input value={translations[lang]?.imageUrl || ''} onChange={e => updateTrans(lang, 'imageUrl', e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Video URL</Label>
                      <Input value={translations[lang]?.videoUrl || ''} onChange={e => updateTrans(lang, 'videoUrl', e.target.value)} className={inputClass} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updatePage.isPending} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              {updatePage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
