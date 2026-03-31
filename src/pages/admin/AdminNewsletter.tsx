import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminSubscribers, useUnsubscribe } from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

export default function AdminNewsletter() {
  const { data, isLoading } = useAdminSubscribers();
  const unsubscribe = useUnsubscribe();

  const subscribers = data?.items ?? [];

  const exportCsv = () => {
    const header = 'Email,Language,Subscribed,Active\n';
    const rows = subscribers
      .map(s => `${s.email},${s.language},${new Date(s.subscribedAt).toLocaleDateString()},${s.isActive}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribe.mutateAsync(id);
      toast.success('Subscriber removed');
    } catch {
      toast.error('Failed to remove subscriber');
    }
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && subscribers.map(s => (
                <TableRow key={s.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{s.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] uppercase">{s.language}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">
                    {s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${s.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {s.isActive ? 'Active' : 'Unsubscribed'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                      onClick={() => handleUnsubscribe(s.id)}
                      disabled={unsubscribe.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && subscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">No subscribers yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
