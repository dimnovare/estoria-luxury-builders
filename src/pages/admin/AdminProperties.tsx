import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { useAdminProperties, useDeleteProperty, useSetPropertyStatus } from '@/hooks/api/useAdmin';
import { useGeocodeMissing } from '@/hooks/api/usePropertyGeocode';
import { propertyTypeLabel, transactionTypeLabel, propertyStatusLabel } from '@/lib/enumLabels';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Sold: 'bg-blue-100 text-blue-700 border-blue-200',
  Rented: 'bg-purple-100 text-purple-700 border-purple-200',
  Archived: 'bg-red-100 text-red-600 border-red-200',
};

const STATUS_VALUES = ['Active', 'Draft', 'Sold', 'Rented', 'Archived'] as const;
const TYPE_VALUES = ['Apartment', 'House', 'Commercial', 'Land', 'Office'] as const;

export default function AdminProperties() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAdminProperties();
  const deleteProperty = useDeleteProperty();
  const setStatus = useSetPropertyStatus();
  const geocodeMissing = useGeocodeMissing();

  const properties = data?.items ?? [];

  const handleGeocodeMissing = async () => {
    try {
      const res = await geocodeMissing.mutateAsync();
      if (res.total === 0) {
        toast.success(t('admin.properties.toast.geocodeAllDone'));
      } else if (res.failed === 0) {
        toast.success(t('admin.properties.toast.geocodeBulkOk', { count: res.geocoded }));
      } else {
        const failedTitles = (res.results ?? [])
          .filter(r => !r.resolved)
          .map(r => r.title || properties.find(p => p.id === r.id)?.title || r.slug);
        toast.warning(
          t('admin.properties.toast.geocodeBulkPartial', { ok: res.geocoded, failed: res.failed }),
          {
            duration: 9000,
            description: failedTitles.length
              ? t('admin.properties.toast.geocodeFailedList', 'Open these and check the address: {{list}}', { list: failedTitles.join(', ') })
              : undefined,
          },
        );
      }
    } catch {
      toast.error(t('admin.properties.toast.geocodeFailed'));
    }
  };

  const filtered = properties.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success(t('admin.properties.toast.deleted'));
    } catch {
      toast.error(t('admin.properties.toast.deleteFailed'));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'Active' ? 'Draft' : 'Active';
    try {
      await setStatus.mutateAsync({ id, status: next });
      toast.success(next === 'Active' ? t('admin.properties.toast.published') : t('admin.properties.toast.unpublished'));
    } catch {
      toast.error(t('admin.properties.toast.statusFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.properties.title')}
        subtitle={t('admin.properties.subtitle', 'Manage property listings. Create a listing, then add images and publish it to make it visible on the public site.')}
        action={
          <>
            <Button
              variant="outline"
              onClick={handleGeocodeMissing}
              disabled={geocodeMissing.isPending}
              title={t('admin.properties.geocodeMissingHint')}
            >
              {geocodeMissing.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <MapPin className="h-4 w-4 mr-2" />}
              {t('admin.properties.geocodeMissing')}
            </Button>
            <Button asChild>
              <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.properties.addNew')}</Link>
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] border-border bg-card text-foreground">
              <SelectValue placeholder={t('admin.properties.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.properties.filters.allStatuses')}</SelectItem>
              {STATUS_VALUES.map(v => (
                <SelectItem key={v} value={v}>{propertyStatusLabel(v, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px] border-border bg-card text-foreground">
              <SelectValue placeholder={t('admin.properties.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.properties.filters.allTypes')}</SelectItem>
              {TYPE_VALUES.map(v => (
                <SelectItem key={v} value={v}>{propertyTypeLabel(v, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      {isError ? (
        <ErrorState
          description={t('admin.properties.loadError', 'Could not load properties. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <TableSkeleton rows={6} cols={7} />
          </CardContent>
        </Card>
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs w-12 hidden sm:table-cell"></TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.properties.table.title')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.properties.table.type')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.properties.table.transaction')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.properties.table.price')}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.properties.table.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="border-border">
                  <TableCell className="py-2 hidden sm:table-cell">
                    <img
                      src={p.coverImageUrl || '/placeholder.jpg'}
                      alt=""
                      className="h-10 w-14 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-foreground font-medium">
                    {p.translations?.['En']?.title ?? p.slug}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{propertyTypeLabel(p.propertyType, t)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{transactionTypeLabel(p.transactionType, t)}</TableCell>
                  <TableCell className="text-sm text-foreground font-medium tabular-nums hidden sm:table-cell">
                    €{p.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {propertyStatusLabel(p.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className={`h-9 w-9 ${p.status === 'Active' ? 'text-success hover:text-amber-600' : 'text-muted-foreground hover:text-success'}`}
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        disabled={setStatus.isPending}
                        aria-label={p.status === 'Active' ? t('admin.properties.unpublish') : t('admin.properties.publish')}
                        title={p.status === 'Active' ? t('admin.properties.unpublish') : t('admin.properties.publish')}
                      >
                        {p.status === 'Active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        asChild
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          to={`/admin/properties/${p.id}/edit`}
                          aria-label={t('admin.common.edit')}
                          title={t('admin.common.edit')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDelete(p.id)}
                        disabled={deleteProperty.isPending}
                        aria-label={t('admin.common.delete')}
                        title={t('admin.common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {filtered.length === 0 && (
            properties.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={t('admin.properties.empty.title', 'No properties yet')}
                description={t('admin.properties.empty.description', 'Create your first listing, then add images and publish it to make it visible on the public site.')}
                action={
                  <Button asChild>
                    <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.properties.addNew')}</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={MapPin}
                title={t('admin.properties.noMatch')}
                description={t('admin.properties.empty.noMatchHint', 'Try adjusting or clearing the filters above.')}
              />
            )
          )}
        </CardContent>
      </Card>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description={(() => {
          const p = properties.find(x => x.id === pendingDelete);
          const title = p?.translations?.['En']?.title ?? p?.slug;
          return title
            ? t('admin.properties.confirmDeleteDesc', { title, defaultValue: `Delete "${title}"? This can't be undone.` })
            : undefined;
        })()}
      />
    </div>
  );
}
