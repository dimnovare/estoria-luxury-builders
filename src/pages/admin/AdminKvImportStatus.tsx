import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ExternalLink, Eye, CalendarClock, CheckCircle2, AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useKvImportStatus } from '@/hooks/api/useKvImportStatus';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PAGE_SIZE = 20;

export default function AdminKvImportStatus() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useKvImportStatus({
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasSearch = debouncedSearch.trim().length > 0;

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(i18n.language);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.kvImportStatus.title')}
        subtitle={t('admin.kvImportStatus.subtitle')}
        action={
          <Button variant="outline" className="shrink-0" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('admin.kvImportStatus.refresh')}
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
              placeholder={t('admin.kvImportStatus.searchPlaceholder')}
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
                  <TableHead className="text-muted-foreground text-xs">{t('admin.kvImportStatus.table.property')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t('admin.kvImportStatus.table.status')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.kvImportStatus.table.kvListing')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.kvImportStatus.table.views')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">{t('admin.kvImportStatus.table.expires')}</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.kvImportStatus.table.received')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-border">
                      <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))}

                {!isLoading &&
                  rows.map((r) => {
                    const isOk = r.status !== 'error';
                    return (
                      <TableRow key={r.id} className="border-border hover:bg-muted/40 transition-colors">
                        <TableCell className="text-sm text-foreground font-medium">
                          {r.propertyId ? (
                            <Link
                              to={`/admin/properties/${r.propertyId}/edit`}
                              className="hover:text-primary transition-colors"
                            >
                              {r.propertyTitle || t('admin.kvImportStatus.unknownProperty')}
                            </Link>
                          ) : (
                            <span>{r.propertyTitle || t('admin.kvImportStatus.unknownProperty')}</span>
                          )}
                          {/* compact secondary info on small screens */}
                          <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                            {fmtDate(r.receivedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOk ? (
                            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('admin.kvImportStatus.status.ok')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/30" title={r.message ?? undefined}>
                              <AlertTriangle className="h-3 w-3" />
                              {t('admin.kvImportStatus.status.error')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {r.externalUrl ? (
                            <a
                              href={r.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              {t('admin.kvImportStatus.viewOnKv')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {r.viewedTimes != null ? (
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                              <Eye className="h-3 w-3" />
                              {r.viewedTimes}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">
                          {r.expireDate ? (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              {fmtDate(r.expireDate)}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground tabular-nums">
                          {fmtDate(r.receivedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {!isLoading && isError && (
            <ErrorState description={t('admin.kvImportStatus.loadError')} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <EmptyState
              icon={Radio}
              title={hasSearch ? t('admin.kvImportStatus.noMatches') : t('admin.kvImportStatus.empty')}
              description={hasSearch ? undefined : t('admin.kvImportStatus.emptyDescription')}
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
              aria-label={t('admin.common.page', { defaultValue: 'Page {{n}}', n: p })}
              aria-current={p === page ? 'page' : undefined}
              className={`h-9 w-9 rounded text-sm tabular-nums cursor-pointer transition-colors ${
                p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
