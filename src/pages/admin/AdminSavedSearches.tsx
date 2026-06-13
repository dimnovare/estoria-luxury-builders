import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/admin/EmptyState';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
      <AdminPageHeader title={t('admin.savedSearches.title')} />

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyFilter)}>
            <SelectTrigger className="w-full sm:w-[180px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
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
            <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
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

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead>{t('admin.savedSearches.fields.email')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('admin.savedSearches.fields.name')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('admin.savedSearches.fields.frequency')}</TableHead>
                <TableHead>{t('admin.savedSearches.fields.status')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('admin.savedSearches.fields.lastSent')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('admin.savedSearches.fields.results')}</TableHead>
                <TableHead className="text-right">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-[hsl(0_0%_93%)]">
                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.map(r => (
                <TableRow key={r.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] truncate max-w-[200px]">{r.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{r.name ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
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
                  <TableCell className="text-xs text-[hsl(0_0%_50%)] hidden lg:table-cell whitespace-nowrap">
                    {r.lastSentAt ? format(new Date(r.lastSentAt), 'dd.MM.yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_40%)] hidden lg:table-cell">{r.lastResultsCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSend(r.id)}
                        disabled={forceSend.isPending}
                        className="h-7"
                        aria-label={t('admin.savedSearches.actions.forceSend')}
                        title={t('admin.savedSearches.actions.forceSend')}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{t('admin.savedSearches.actions.forceSend')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(r.id)}
                        className="h-7 text-red-500 hover:text-red-600"
                        aria-label={t('admin.common.delete')}
                        title={t('admin.common.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {!isLoading && rows.length === 0 && (
            <EmptyState
              icon={Search}
              title={t('admin.savedSearches.empty')}
              description={t('admin.savedSearches.emptyDescription')}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('admin.savedSearches.confirmDelete')}
        description={t('admin.savedSearches.confirmDeleteDesc')}
      />
    </div>
  );
}
