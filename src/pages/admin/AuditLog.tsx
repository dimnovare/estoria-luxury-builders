import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, LogIn, ChevronLeft, ChevronRight, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  if (action.includes('Create') || action.includes('Add')) return { icon: Plus, color: 'text-green-500' };
  if (action.includes('Update') || action.includes('Edit')) return { icon: Pencil, color: 'text-blue-500' };
  if (action.includes('Delete') || action.includes('Remove')) return { icon: Trash2, color: 'text-red-500' };
  if (action.includes('Login') || action.includes('Logout')) return { icon: LogIn, color: 'text-[hsl(0_0%_50%)]' };
  return { icon: Eye, color: 'text-[hsl(0_0%_50%)]' };
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

  const { data, isLoading } = useAuditLog({ page, userId: userId || undefined, action: actionPrefix || undefined, entityType: entityType || undefined, from: from || undefined, to: to || undefined });
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
      <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.audit.title')}</h1>

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full sm:w-[180px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
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
            <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.audit.filters.action')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {ACTION_PREFIXES.map(p => (
                <SelectItem key={p} value={p}>{p.replace('.', '')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            placeholder={t('admin.audit.filters.entityType')}
            className="w-full sm:w-[140px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
          />

          <Input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full sm:w-[150px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
            placeholder={t('admin.audit.filters.dateRange')}
          />
          <Input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full sm:w-[150px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs whitespace-nowrap">{t('admin.audit.when')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.audit.who')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.audit.action')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.audit.entity')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-10 hidden sm:table-cell">{t('admin.audit.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">
                    {t('admin.common.loading')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && entries.map(entry => {
                const { icon: ActionIcon, color } = actionCategoryIcon(entry.action);
                const details = parseDetails(entry.detailsJson);
                const isExpanded = expandedId === entry.id;
                return (
                  <TableRow key={entry.id} className="border-[hsl(0_0%_93%)] align-top">
                    <TableCell className="text-sm text-[hsl(0_0%_40%)] whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</TooltipTrigger>
                        <TooltipContent>{new Date(entry.createdAt).toLocaleString()}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(0_0%_20%)] max-w-[180px]">
                      <div className="break-all text-xs sm:text-sm">{getDisplayEmail(entry)}</div>
                      <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden flex items-center gap-1 mt-0.5">
                        <ActionIcon className={`h-3 w-3 ${color}`} />
                        <span className="truncate">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon className={`h-3.5 w-3.5 ${color}`} />
                        <span className="text-[hsl(0_0%_20%)]">{entry.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">
                      {entry.entityType && (
                        <span className="flex items-center gap-1">
                          {entry.entityType}
                          {entry.entityId && (
                            <button
                              onClick={() => copyToClipboard(entry.entityId!)}
                              className="text-[hsl(0_0%_60%)] hover:text-[hsl(0_0%_30%)]"
                              title="Copy ID"
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
                          className="h-7 w-7 text-[hsl(0_0%_50%)]"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Expanded detail rows */}
              {!isLoading && entries.map(entry => {
                if (expandedId !== entry.id) return null;
                const details = parseDetails(entry.detailsJson);
                if (!details) return null;
                return (
                  <TableRow key={`${entry.id}-details`} className="border-[hsl(0_0%_93%)]">
                    <TableCell colSpan={5} className="bg-[hsl(0_0%_97%)] p-4">
                      <pre className="text-xs text-[hsl(0_0%_30%)] font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          {!isLoading && entries.length === 0 && (
            <p className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.audit.empty')}</p>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 border-[hsl(0_0%_85%)]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[hsl(0_0%_50%)]">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 border-[hsl(0_0%_85%)]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
