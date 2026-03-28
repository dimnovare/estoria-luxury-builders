import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockSubscribers } from '@/data/mockAdmin';
import { toast } from 'sonner';

export default function AdminNewsletter() {
  const exportCsv = () => {
    const header = 'Email,Language,Subscribed,Status\n';
    const rows = mockSubscribers.map(s => `${s.email},${s.language},${s.subscribedAt},${s.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'newsletter-subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Newsletter Subscribers</h1>
        <Button onClick={exportCsv} variant="outline" className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)]">
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Email</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Language</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Subscribed</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Status</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubscribers.map(s => (
                <TableRow key={s.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{s.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] uppercase">{s.language}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">{s.subscribedAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${s.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500" onClick={() => toast.success('Subscriber removed')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
