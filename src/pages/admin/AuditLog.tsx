import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, LogIn, ChevronLeft, ChevronRight, Copy, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { useAuditLog } from '@/hooks/api/useAuditLog';
import { useAdminUsers } from '@/hooks/api/useAdminUsers';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const ACTION_PREFIXES = [
  'Property.',
  'Blog.',
  'Team.',
  'Service.',
  'Career.',
  'Auth.',
  'User.',
  'Page.',
  'Newsletter.',
  'Contact.',
];

const actionCategoryIcon = (action: string) => {
  if (action.includes('Create') || action.includes('Add')) return { icon: Plus, color: 'text-success' };
  if (action.includes('Update') || action.includes('Edit')) return { icon: Pencil, color: 'text-blue-500' };
  if (action.includes('Delete') || action.includes('Remove')) return { icon: Trash2, color: 'text-destructive' };
  if (action.includes('Login') || action.includes('Logout')) return { icon: LogIn, color: 'text-muted-foreground' };
  return { icon: Eye, color: 'text-muted-foreground' };
};

function parseDetails(json?: string): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getDisplayEmail(entry: { userId?: string | null; userEmail: string; action: string; detailsJson?: string }): string {
  if (!entry.userId && entry.action.includes('LoginFailed')) {
    const details = parseDetails(entry.detailsJson);
    if (details?.attemptedEmail && typeof details.attemptedEmail === 'string') {
      return details.attemptedEmail;
    }
  }
  return entry.userEmail;
}

export default function AuditLog() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [actionPrefix, setActionPrefix] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // "All" is the cleared state — Radix Select can't use an empty string as a
  // value, so it sends the literal 'all'. Map that back to undefined (no filter)
  // before querying, otherwise the API filters on a user/action named "all" and
  // returns an empty table.
  const { data, isLoading, isError, refetch } = useAuditLog({
    page,
    userId: userId && userId !== 'all' ? userId : undefined,
    action: actionPrefix && actionPrefix !== 'all' ? actionPrefix : undefined,
    entityType: entityType || undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const { data: usersData } = useAdminUsers(1, '');

  const entries = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;
  const users = usersData?.items ?? [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('blog.copied'));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.audit.title')}
        subtitle={t('admin.audit.subtitle', 'System log of all admin actions. Use for troubleshooting or compliance review.')}
      />

      {/* Filters */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full sm:w-[180px] border-border bg-card text-foreground">
              <SelectValue placeholder={t('admin.audit.filters.user')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionPrefix} onValueChange={setActionPrefix}>
            <SelectTrigger className="w-full sm:w-[160px] border-border bg-card text-foreground">
              <SelectValue placeholder={t('admin.audit.filters.action')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {ACTION_PREFIXES.map(p => (
                <SelectItem key={p} value={p}>{t(`admin.audit.category.${p.replace('.', '')}`, p.replace('.', ''))}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            placeholder={t('admin.audit.filters.entityType')}
            className="w-full sm:w-[140px] border-border bg-card text-foreground"
          />

          <Input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full sm:w-[150px] border-border bg-card text-foreground"
            placeholder={t('admin.audit.filters.dateRange')}
          />
          <Input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full sm:w-[150px] border-border bg-card text-foreground"
          />
        </CardContent>
      </Card>

      {/* Table */}
      {isError ? (
        <ErrorState
          description={t('admin.audit.loadError', 'Could not load the audit log. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <TableSkeleton rows={8} cols={5} />
          </CardContent>
        </Card>
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">{t('admin.audit.when')}</TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.audit.who')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.audit.action')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.audit.entity')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-10 hidden sm:table-cell">{t('admin.audit.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => {
                const { icon: ActionIcon, color } = actionCategoryIcon(entry.action);
                const details = parseDetails(entry.detailsJson);
                const isExpanded = expandedId === entry.id;
                return (
                  <TableRow key={entry.id} className="border-border align-top">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</TooltipTrigger>
                        <TooltipContent>{new Date(entry.createdAt).toLocaleString()}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-[180px]">
                      <div className="break-all text-xs sm:text-sm">{getDisplayEmail(entry)}</div>
                      <div className="text-xs text-muted-foreground sm:hidden flex items-center gap-1 mt-0.5">
                        <ActionIcon className={`h-3 w-3 ${color}`} />
                        <span className="truncate">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon className={`h-3.5 w-3.5 ${color}`} />
                        <span className="text-foreground">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {entry.entityType && (
                        <span className="flex items-center gap-1">
                          {entry.entityType}
                          {entry.entityId && (
                            <button
                              onClick={() => copyToClipboard(entry.entityId!)}
                              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title={t('admin.audit.copyId', 'Copy ID')}
                              aria-label={t('admin.audit.copyId', 'Copy ID')}
                            >
                              <span className="text-xs font-mono">{entry.entityId.slice(0, 8)}…</span>
                              <Copy className="h-3 w-3 inline ml-0.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {details && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          aria-label={isExpanded ? t('admin.audit.hideDetails', 'Hide details') : t('admin.audit.showDetails', 'Show details')}
                          title={isExpanded ? t('admin.audit.hideDetails', 'Hide details') : t('admin.audit.showDetails', 'Show details')}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Expanded detail rows */}
              {entries.map(entry => {
                if (expandedId !== entry.id) return null;
                const details = parseDetails(entry.detailsJson);
                if (!details) return null;
                return (
                  <TableRow key={`${entry.id}-details`} className="border-border">
                    <TableCell colSpan={5} className="bg-muted p-4">
                      <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          {entries.length === 0 && (
            <EmptyState icon={ScrollText} title={t('admin.audit.empty')} />
          )}
        </CardContent>
      </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 border-border" aria-label={t('admin.common.previous', 'Previous page')} title={t('admin.common.previous', 'Previous page')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 border-border" aria-label={t('admin.common.next', 'Next page')} title={t('admin.common.next', 'Next page')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
