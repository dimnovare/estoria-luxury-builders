import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPages } from '@/data/mockAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

export default function AdminPages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<typeof mockPages[0] | null>(null);

  const openEdit = (page: typeof mockPages[0]) => { setEditingPage(page); setDialogOpen(true); };

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
              {mockPages.map(p => (
                <TableRow key={p.key} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] font-mono">{p.key}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{p.label}</TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">{editingPage?.label}</DialogTitle>
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
                      <Input defaultValue={editingPage.translations[lang]?.title || ''} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Body</Label>
                      <Textarea rows={6} defaultValue={editingPage.translations[lang]?.body || ''} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Image URL</Label>
                      <Input defaultValue={editingPage.translations[lang]?.imageUrl || ''} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Video URL</Label>
                      <Input defaultValue={editingPage.translations[lang]?.videoUrl || ''} className={inputClass} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => { toast.success('Page content saved'); setDialogOpen(false); }} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              Save Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
