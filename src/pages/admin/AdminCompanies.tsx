import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, Building2, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useCompanies, useDeleteCompany } from '@/hooks/api/useRelationships';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PAGE_SIZE = 20;

export default function AdminCompanies() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCompanies({
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const deleteMutation = useDeleteCompany();

  const companies = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasSearch = debouncedSearch.trim().length > 0;

  const handleDelete = async () => {
    if (!deleteId) return;
    // Hook surfaces its own success/error toasts; we just close the dialog.
    await deleteMutation.mutateAsync(deleteId).catch(() => {});
    setDeleteId(null);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.companies.title')}
        subtitle={t('admin.companies.subtitle')}
        action={
          <Button asChild className="shrink-0">
            <Link to="/admin/companies/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.companies.addNew')}
            </Link>
          </Button>
        }
      />

      {/* Search */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('admin.companies.searchPlaceholder')}
              className="pl-9 h-11 border-border bg-card text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs w-12 hidden sm:table-cell"></TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t('admin.companies.table.name')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.companies.table.registryCode')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">{t('admin.common.email')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.companies.table.people')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.companies.table.properties')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs w-24">{t('admin.common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-border">
                      <TableCell className="py-2 hidden sm:table-cell"><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))}

                {!isLoading &&
                  companies.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/admin/companies/${c.id}`)}
                    >
                      <TableCell className="py-2 hidden sm:table-cell">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{getInitials(c.name)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-medium">
                        <Link
                          to={`/admin/companies/${c.id}`}
                          className="hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted-foreground md:hidden">{c.registryCode || ''}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell tabular-nums">{c.registryCode || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{c.email || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30 tabular-nums">
                          <Users className="h-3 w-3" />
                          {c.peopleCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30 tabular-nums">
                          <Home className="h-3 w-3" />
                          {c.propertyCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-muted-foreground hover:text-foreground">
                            <Link to={`/admin/companies/${c.id}/edit`} aria-label={t('admin.common.edit')} title={t('admin.common.edit')}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(c.id)}
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

          {!isLoading && isError && (
            <ErrorState description={t('admin.companies.loadError')} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && companies.length === 0 && (
            <EmptyState
              icon={Building2}
              title={hasSearch ? t('admin.companies.noMatches') : t('admin.companies.empty')}
              description={hasSearch ? undefined : t('admin.companies.emptyDescription')}
              action={
                hasSearch ? undefined : (
                  <Button asChild variant="outline" className="border-primary text-primary">
                    <Link to="/admin/companies/new">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('admin.companies.addNew')}
                    </Link>
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded text-sm tabular-nums cursor-pointer transition-colors ${
                p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.companies.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('admin.companies.confirmDeleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {t('admin.common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
