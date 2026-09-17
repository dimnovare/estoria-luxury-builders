import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, EyeOff, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import {
  useAdminProperties, useDeleteProperty, useSetPropertyStatus,
  type AdminProperty, type AdminPropertyScope,
} from '@/hooks/api/useAdmin';
import { useGeocodeMissing } from '@/hooks/api/usePropertyGeocode';
import {
  propertyTypeLabel, transactionTypeLabel, propertyStatusLabel, propertyClosureReasonLabel,
} from '@/lib/enumLabels';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Draft: 'bg-amber-100 text-amber-700 border-amber-200',
  Passive: 'bg-gray-100 text-gray-600 border-gray-200',
  Sold: 'bg-blue-100 text-blue-700 border-blue-200',
  Rented: 'bg-purple-100 text-purple-700 border-purple-200',
  Archived: 'bg-red-100 text-red-600 border-red-200',
};

/** Statuses that keep an object on the working list vs. move it to the archive. */
const CURRENT_STATUSES = ['Draft', 'Active', 'Passive'] as const;
const COMPLETED_STATUSES = ['Sold', 'Rented', 'Archived'] as const;
const CLOSURE_REASONS = ['ClientWithdrew', 'AgentWithdrew', 'ContractEnded', 'Other'] as const;
const TYPE_VALUES = ['Apartment', 'House', 'Commercial', 'Land', 'Office'] as const;

/** Prefer the Estonian text, fall back to the other languages. */
function pickTrans(p: AdminProperty, field: 'title' | 'address' | 'city'): string {
  const tr = p.translations ?? {};
  return (tr['Et']?.[field] || tr['En']?.[field] || tr['Ru']?.[field] || '').trim();
}

export default function AdminProperties() {
  const { t, i18n } = useTranslation();
  const [scope, setScope] = useState<AdminPropertyScope>('Current');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  // Choosing "Lõpetatud" needs a reason, so the change is staged until picked.
  const [closing, setClosing] = useState<{ id: string; reason: string } | null>(null);

  const isArchive = scope === 'Completed';

  const { data, isLoading, isError, refetch } = useAdminProperties(1, {
    scope,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    closureReason: isArchive && reasonFilter !== 'all' ? reasonFilter : undefined,
  });
  const deleteProperty = useDeleteProperty();
  const setStatus = useSetPropertyStatus();
  const geocodeMissing = useGeocodeMissing();

  const properties = data?.items ?? [];

  const switchScope = (next: AdminPropertyScope) => {
    setScope(next);
    setStatusFilter('all');
    setReasonFilter('all');
  };

  const handleGeocodeMissing = async () => {
    try {
      const res = await geocodeMissing.mutateAsync();
      if (res.total === 0) {
        toast.success(t('admin.properties.toast.geocodeAllDone'));
      } else if (res.failed === 0) {
        toast.success(t('admin.properties.toast.geocodeBulkOk', { count: res.geocoded }));
      } else {
        const failedTitles = (res.results ?? [])
          .filter(r => !r.ok)
          .map(r => r.title || properties.find(p => p.id === r.id)?.slug || r.id);
        toast.warning(
          t('admin.properties.toast.geocodeBulkPartial', { ok: res.geocoded, failed: res.failed }),
          {
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

  // Status and reason filter server-side (so the archive filters across every
  // record, not just the loaded page); type stays a local refinement.
  const filtered = properties.filter(p => typeFilter === 'all' || p.propertyType === typeFilter);

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success(t('admin.properties.toast.deleted'));
    } catch {
      toast.error(t('admin.properties.toast.deleteFailed'));
    }
  };

  const applyStatus = async (id: string, status: string, closureReason?: string | null) => {
    try {
      await setStatus.mutateAsync({ id, status, closureReason: closureReason ?? null });
      toast.success(t('admin.properties.toast.statusChanged', {
        status: propertyStatusLabel(status, t),
        defaultValue: 'Status updated.',
      }));
    } catch {
      toast.error(t('admin.properties.toast.statusFailed'));
    }
  };

  const handleStatusPick = (id: string, next: string) => {
    // "Lõpetatud" carries a reason — collect it before saving.
    if (next === 'Archived') { setClosing({ id, reason: 'ClientWithdrew' }); return; }
    applyStatus(id, next);
  };

  // Quick publish toggle: Active to Passive keeps the object on the working list.
  const handleTogglePublish = (p: AdminProperty) =>
    applyStatus(p.id, p.status === 'Active' ? 'Passive' : 'Active');

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language) : '';

  const statusOptions = isArchive ? COMPLETED_STATUSES : CURRENT_STATUSES;

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

      {/* Working list vs. finished work */}
      <Tabs value={scope} onValueChange={(v) => switchScope(v as AdminPropertyScope)}>
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="Current" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('admin.properties.tabCurrent', 'Active objects')}
          </TabsTrigger>
          <TabsTrigger value="Completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('admin.properties.tabCompleted', 'Completed objects')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-border bg-card text-foreground">
              <SelectValue placeholder={t('admin.properties.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.properties.filters.allStatuses')}</SelectItem>
              {statusOptions.map(v => (
                <SelectItem key={v} value={v}>{propertyStatusLabel(v, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isArchive && (
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full sm:w-[200px] border-border bg-card text-foreground">
                <SelectValue placeholder={t('admin.properties.filters.reason', 'Closing reason')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.properties.filters.allReasons', 'All reasons')}</SelectItem>
                {CLOSURE_REASONS.map(v => (
                  <SelectItem key={v} value={v}>{propertyClosureReasonLabel(v, t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
                <TableHead className="text-muted-foreground text-xs w-[104px]"></TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.properties.table.address', 'Address')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.properties.table.type')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.properties.table.transaction')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.properties.table.price')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-[190px]">{t('admin.properties.table.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const address = pickTrans(p, 'address');
                const city = pickTrans(p, 'city');
                const title = pickTrans(p, 'title');
                const primary = [address, city].filter(Boolean).join(', ');
                return (
                <TableRow key={p.id} className="border-border">
                  <TableCell className="py-2">
                    <Link to={`/admin/properties/${p.id}/edit`}>
                      {p.coverImageUrl ? (
                        <img
                          src={p.coverImageUrl}
                          alt=""
                          loading="lazy"
                          className="h-16 w-24 object-cover rounded-md border border-border"
                        />
                      ) : (
                        // No cover yet — a neutral tile reads better than a broken image,
                        // which the larger preview would make very obvious.
                        <div
                          className="h-16 w-24 rounded-md border border-border bg-muted flex items-center justify-center"
                          title={t('admin.properties.noImage', 'No photo yet')}
                        >
                          <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link to={`/admin/properties/${p.id}/edit`} className="block hover:underline">
                      <span className="text-foreground font-medium">
                        {primary || title || p.slug}
                      </span>
                    </Link>
                    {/* The listing headline stays as a secondary line — the address
                        is what identifies an object during day-to-day work. */}
                    {primary && title && (
                      <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{title}</span>
                    )}
                    {isArchive && p.completedAt && (
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {t('admin.properties.completedAt', { date: fmtDate(p.completedAt), defaultValue: 'Completed' })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{propertyTypeLabel(p.propertyType, t)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{transactionTypeLabel(p.transactionType, t)}</TableCell>
                  <TableCell className="text-sm text-foreground font-medium tabular-nums hidden sm:table-cell">
                    €{p.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Select value={p.status} onValueChange={(v) => handleStatusPick(p.id, v)} disabled={setStatus.isPending}>
                      <SelectTrigger className="h-8 w-[170px] border-border bg-card text-xs">
                        <SelectValue>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                          >
                            {propertyStatusLabel(p.status, t)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {[...CURRENT_STATUSES, ...COMPLETED_STATUSES].map(v => (
                          <SelectItem key={v} value={v}>{propertyStatusLabel(v, t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {p.status === 'Archived' && p.closureReason && (
                      <span className="block text-[11px] text-muted-foreground mt-1">
                        {propertyClosureReasonLabel(p.closureReason, t)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!isArchive && (
                        <Button
                          variant="ghost" size="icon"
                          className={`h-9 w-9 ${p.status === 'Active' ? 'text-success hover:text-amber-600' : 'text-muted-foreground hover:text-success'}`}
                          onClick={() => handleTogglePublish(p)}
                          disabled={setStatus.isPending}
                          aria-label={p.status === 'Active' ? t('admin.properties.unpublish') : t('admin.properties.publish')}
                          title={p.status === 'Active' ? t('admin.properties.unpublish') : t('admin.properties.publish')}
                        >
                          {p.status === 'Active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      )}
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
                );
              })}
            </TableBody>
          </Table>
          </div>
          {filtered.length === 0 && (
            isArchive ? (
              <EmptyState
                icon={MapPin}
                title={t('admin.properties.empty.completedTitle', 'No completed objects yet')}
                description={t('admin.properties.empty.completedDesc', 'When you mark an object sold, rented out or closed, it moves here.')}
              />
            ) : properties.length === 0 ? (
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

      {/* Reason picker — required when finishing an object with "Lõpetatud". */}
      <Dialog open={!!closing} onOpenChange={(o) => !o && setClosing(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t('admin.properties.statusDialogTitle', 'Change status')}</DialogTitle>
            <DialogDescription>
              {t('admin.properties.statusDialogDesc', 'Pick the new status for this object.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground font-medium">
              {t('admin.properties.closureReasonLabel', 'Closing reason')}
            </Label>
            <Select
              value={closing?.reason ?? 'ClientWithdrew'}
              onValueChange={(v) => setClosing(c => (c ? { ...c, reason: v } : c))}
            >
              <SelectTrigger className="border-border bg-card text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLOSURE_REASONS.map(v => (
                  <SelectItem key={v} value={v}>{propertyClosureReasonLabel(v, t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosing(null)}>{t('admin.common.cancel')}</Button>
            <Button
              onClick={() => {
                if (!closing) return;
                applyStatus(closing.id, 'Archived', closing.reason);
                setClosing(null);
              }}
              disabled={setStatus.isPending}
            >
              {t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description={(() => {
          const p = properties.find(x => x.id === pendingDelete);
          if (!p) return undefined;
          const label = [pickTrans(p, 'address'), pickTrans(p, 'city')].filter(Boolean).join(', ')
            || pickTrans(p, 'title') || p.slug;
          return t('admin.properties.confirmDeleteDesc', { title: label, defaultValue: 'Delete this listing? This cannot be undone.' });
        })()}
      />
    </div>
  );
}
