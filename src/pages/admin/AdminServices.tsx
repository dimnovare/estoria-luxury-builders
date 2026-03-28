import { useState } from 'react';
import { Plus, Pencil, GripVertical, Trash2 } from 'lucide-react';
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
import { mockServices } from '@/data/mockContent';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

export default function AdminServices() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [iconName, setIconName] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [active, setActive] = useState(true);

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Services</h1>
        <Button onClick={() => { setIconName(''); setSortOrder(''); setActive(true); setDialogOpen(true); }} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Plus className="h-4 w-4 mr-2" />Add Service
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-8"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Icon</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Name</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Price</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Order</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockServices.map((s, i) => (
                <TableRow key={s.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell><GripVertical className="h-4 w-4 text-[hsl(0_0%_70%)] cursor-grab" /></TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{s.icon}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{s.title}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">{s.price || '—'}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]" onClick={() => setDialogOpen(true)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500" onClick={() => toast.success('Service deleted')}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Icon Name</Label>
                <Input value={iconName} onChange={e => setIconName(e.target.value)} placeholder="Building2" className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label className={labelClass}>Active</Label>
              </div>
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
                    <Label className={labelClass}>Name</Label>
                    <Input className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Description</Label>
                    <Textarea rows={4} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Price Info</Label>
                    <Input className={inputClass} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => { toast.success('Service saved'); setDialogOpen(false); }} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              Save Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
