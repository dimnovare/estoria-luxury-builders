import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockMessages, type AdminMessage } from '@/data/mockAdmin';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  new: 'bg-[hsl(43_50%_90%)] text-[hsl(43_50%_40%)] border-[hsl(43_50%_70%)]',
  read: 'bg-blue-100 text-blue-700 border-blue-200',
  replied: 'bg-green-100 text-green-700 border-green-200',
};

export default function AdminMessages() {
  const [selected, setSelected] = useState<AdminMessage | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Messages</h1>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Name</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Email</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Subject</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Date</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMessages.map(m => (
                <TableRow key={m.id} className="border-[hsl(0_0%_93%)] cursor-pointer hover:bg-[hsl(0_0%_98%)]" onClick={() => setSelected(m)}>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{m.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_30%)]">{m.subject}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">{m.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[m.status]}`}>{m.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg bg-white border-[hsl(0_0%_90%)]">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[hsl(0_0%_15%)]">{selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[hsl(0_0%_50%)]">From:</span> <span className="text-[hsl(0_0%_20%)] font-medium">{selected.name}</span></div>
                  <div><span className="text-[hsl(0_0%_50%)]">Email:</span> <a href={`mailto:${selected.email}`} className="text-[hsl(43_50%_54%)] hover:underline">{selected.email}</a></div>
                  {selected.phone && <div><span className="text-[hsl(0_0%_50%)]">Phone:</span> <span className="text-[hsl(0_0%_20%)]">{selected.phone}</span></div>}
                  <div><span className="text-[hsl(0_0%_50%)]">Date:</span> <span className="text-[hsl(0_0%_20%)]">{selected.date}</span></div>
                </div>
                {selected.propertyId && (
                  <div className="text-sm">
                    <span className="text-[hsl(0_0%_50%)]">Property:</span>{' '}
                    <span className="text-[hsl(43_50%_54%)]">{selected.propertyId}</span>
                  </div>
                )}
                <div className="bg-[hsl(0_0%_97%)] rounded-lg p-4 text-sm text-[hsl(0_0%_25%)] leading-relaxed">
                  {selected.message}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)] text-sm" onClick={() => { toast.success('Marked as read'); setSelected(null); }}>
                    Mark Read
                  </Button>
                  <Button className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] text-sm" onClick={() => { toast.success('Marked as replied'); setSelected(null); }}>
                    Mark Replied
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
