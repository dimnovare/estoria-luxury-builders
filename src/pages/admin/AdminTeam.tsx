import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTeam } from '@/data/mockContent';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;
const allLanguages = ['Estonian', 'English', 'Russian', 'Finnish', 'German', 'French', 'Swedish'];

export default function AdminTeam() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [active, setActive] = useState(true);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);

  const openNew = () => { setPhone(''); setEmail(''); setSortOrder(''); setActive(true); setSelectedLangs([]); setDialogOpen(true); };

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

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
              {mockTeam.map(m => (
                <TableRow key={m.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell><img src={m.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" /></TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{m.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.languages.map(l => (
                        <Badge key={l} variant="secondary" className="text-[10px] bg-[hsl(0_0%_93%)] text-[hsl(0_0%_40%)]">{l}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)]">{m.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]" onClick={() => setDialogOpen(true)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500" onClick={() => toast.success('Member removed')}>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-[hsl(0_0%_90%)]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Photo upload */}
            <div className="space-y-2">
              <Label className={labelClass}>Photo</Label>
              <div className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-4 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer">
                <p className="text-sm text-[hsl(0_0%_50%)]">Upload photo</p>
              </div>
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
              <Label className={labelClass}>Languages</Label>
              <div className="flex flex-wrap gap-3">
                {allLanguages.map(l => (
                  <label key={l} className="flex items-center gap-1.5 text-sm text-[hsl(0_0%_30%)]">
                    <Checkbox checked={selectedLangs.includes(l)} onCheckedChange={() => toggleLang(l)} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label className={labelClass}>Active</Label>
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
                    <Input className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Role</Label>
                    <Input className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Bio</Label>
                    <Textarea rows={4} className={inputClass} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => { toast.success('Team member saved'); setDialogOpen(false); }} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
              Save Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
