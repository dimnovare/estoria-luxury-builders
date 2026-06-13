import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
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

  const { data, isLoading, isError, refetch } = useAdminSavedSearches({
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

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyFilter)}>
            <SelectTrigger className="w-full sm:w-[180px] border-border bg-card text-foreground">
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
            <SelectTrigger className="w-full sm:w-[160px] border-border bg-card text-foreground">
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

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isError ? (
            <div className="p-4">
              <ErrorState
                description={t('admin.savedSearches.loadError', 'Could not load saved searches.')}
                onRetry={() => refetch()}
              />
            </div>
          ) : isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={4} cols={7} />
            </div>
          ) : (
          <>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
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
              {rows.map(r => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="text-sm text-foreground truncate max-w-[200px]">{r.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{r.name ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`admin.savedSearches.frequency.${r.frequency}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${r.isActive ? 'border-success text-success' : 'border-border text-muted-foreground'}`}
                    >
                      {r.isActive ? t('admin.savedSearches.active') : t('admin.savedSearches.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap tabular-nums">
                    {r.lastSentAt ? format(new Date(r.lastSentAt), 'dd.MM.yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell tabular-nums">{r.lastResultsCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSend(r.id)}
                        disabled={forceSend.isPending}
                        className="h-9"
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
                        className="h-9 w-9 text-destructive hover:text-destructive"
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
          {rows.length === 0 && (
            <EmptyState
              icon={Search}
              title={t('admin.savedSearches.empty')}
              description={t('admin.savedSearches.emptyDescription')}
            />
          )}
          </>
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
