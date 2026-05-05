import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import {
  useAdminSavedSearches,
  useForceSendSavedSearch,
  useDeleteSavedSearch,
  type SavedSearchFrequency,
} from '@/hooks/api/useSavedSearches';
import { toast } from 'sonner';
import { format } from 'date-fns';

type FrequencyFilter = SavedSearchFrequency | 'all';
type ActiveFilter = 'all' | 'active' | 'inactive';

export default function AdminSavedSearches() {
  const { t } = useTranslation();

  const [frequency, setFrequency] = useState<FrequencyFilter>('all');
  const [active, setActive] = useState<ActiveFilter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminSavedSearches({
    frequency: frequency === 'all' ? undefined : frequency,
    isActive: active === 'all' ? undefined : active === 'active',
  });

  const forceSend = useForceSendSavedSearch();
  const remove = useDeleteSavedSearch();

  const rows = data ?? [];

  const handleForceSend = async (id: string) => {
    try {
      const r = await forceSend.mutateAsync(id);
      toast.success(t('admin.savedSearches.toast.sent', { count: r?.matchesFound ?? 0 }));
    } catch {
      toast.error(t('admin.savedSearches.toast.sendFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success(t('admin.savedSearches.toast.deleted'));
      setDeleteId(null);
    } catch {
      toast.error(t('admin.savedSearches.toast.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">
          {t('admin.savedSearches.title')}
        </h1>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyFilter)}>
            <SelectTrigger className="w-[180px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.savedSearches.filters.frequency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              <SelectItem value="Instant">{t('admin.savedSearches.frequency.Instant')}</SelectItem>
              <SelectItem value="Daily">{t('admin.savedSearches.frequency.Daily')}</SelectItem>
              <SelectItem value="Weekly">{t('admin.savedSearches.frequency.Weekly')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={active} onValueChange={(v) => setActive(v as ActiveFilter)}>
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.savedSearches.filters.active')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              <SelectItem value="active">{t('admin.savedSearches.active')}</SelectItem>
              <SelectItem value="inactive">{t('admin.savedSearches.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead>{t('admin.savedSearches.fields.email')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.name')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.frequency')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.status')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.lastSent')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.results')}</TableHead>
                <TableHead className="text-right">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-[hsl(0_0%_93%)]">
                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.map(r => (
                <TableRow key={r.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)]">{r.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{r.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {t(`admin.savedSearches.frequency.${r.frequency}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${r.isActive ? 'border-green-300 text-green-700' : 'border-[hsl(0_0%_85%)] text-[hsl(0_0%_50%)]'}`}
                    >
                      {r.isActive ? t('admin.savedSearches.active') : t('admin.savedSearches.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)]">
                    {r.lastSentAt ? format(new Date(r.lastSentAt), 'dd.MM.yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_40%)]">{r.lastResultsCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSend(r.id)}
                        disabled={forceSend.isPending}
                        className="h-7"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {t('admin.savedSearches.actions.forceSend')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(r.id)}
                        className="h-7 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && rows.length === 0 && (
            <EmptyState
              icon={Search}
              title={t('admin.savedSearches.empty')}
              description={t('admin.savedSearches.emptyDescription')}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.savedSearches.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.savedSearches.confirmDeleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              {t('admin.common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
