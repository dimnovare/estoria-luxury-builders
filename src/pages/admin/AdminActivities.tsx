import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  StickyNote, Phone, Mail, Users, Eye, FileSignature, ArrowRightLeft, Settings,
  Search, ChevronLeft, ChevronRight, ScrollText,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/admin/EmptyState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminUsers } from '@/hooks/api/useAdminUsers';
import {
  useActivities,
  ACTIVITY_TYPES,
  type AdminActivityType,
} from '@/hooks/api/useActivities';

const PAGE_SIZE = 20;

const activityIcons: Record<string, typeof StickyNote> = {
  Note: StickyNote, Call: Phone, Email: Mail, Meeting: Users,
  Viewing: Eye, OfferMade: FileSignature, StageChange: ArrowRightLeft,
  ContractEvent: FileSignature, SystemEvent: Settings,
};

export default function AdminActivities() {
  const { t } = useTranslation();

  const [type, setType] = useState<'all' | AdminActivityType>('all');
  const [userId, setUserId] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [occurredAfter, setOccurredAfter] = useState('');
  const [occurredBefore, setOccurredBefore] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 250);

  const { data: usersData } = useAdminUsers(1, '');
  const users = useMemo(() => usersData?.items ?? [], [usersData]);

  const filter = useMemo(() => ({
    type:           type === 'all' ? undefined : type,
    userId:         userId === 'all' ? undefined : userId,
    search:         debouncedSearch.trim() || undefined,
    occurredAfter:  occurredAfter || undefined,
    occurredBefore: occurredBefore || undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [type, userId, debouncedSearch, occurredAfter, occurredBefore, page]);

  const { data, isLoading } = useActivities(filter);
  const activities = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('admin.activities.title')} />

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(0_0%_60%)]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin.activities.searchPlaceholder')}
              className="pl-9 bg-white border-[hsl(0_0%_85%)] text-sm"
            />
          </div>

          <Select value={type} onValueChange={(v) => { setType(v as 'all' | AdminActivityType); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.activities.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {ACTIVITY_TYPES.map(at => (
                <SelectItem key={at} value={at}>{t(`admin.activities.types.${at}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userId} onValueChange={(v) => { setUserId(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.activities.filters.user')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.all')}</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-3 w-full sm:w-auto">
            <Input
              type="date"
              value={occurredAfter}
              onChange={(e) => { setOccurredAfter(e.target.value); setPage(1); }}
              className="flex-1 sm:w-[150px] bg-white border-[hsl(0_0%_85%)] text-sm"
              aria-label={t('admin.activities.filters.from')}
            />
            <Input
              type="date"
              value={occurredBefore}
              onChange={(e) => { setOccurredBefore(e.target.value); setPage(1); }}
              className="flex-1 sm:w-[150px] bg-white border-[hsl(0_0%_85%)] text-sm"
              aria-label={t('admin.activities.filters.to')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead>{t('admin.activities.table.when')}</TableHead>
                <TableHead>{t('admin.activities.table.type')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('admin.activities.table.title')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('admin.activities.table.linkedTo')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('admin.activities.table.user')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-[hsl(0_0%_93%)]">
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && activities.map(a => {
                const Icon = activityIcons[a.type] ?? StickyNote;
                return (
                  <TableRow key={a.id} className="border-[hsl(0_0%_93%)]">
                    <TableCell className="text-xs text-[hsl(0_0%_50%)]">
                      <Tooltip>
                        <TooltipTrigger>{formatDistanceToNow(new Date(a.occurredAt), { addSuffix: true })}</TooltipTrigger>
                        <TooltipContent>{format(new Date(a.occurredAt), 'dd.MM.yyyy HH:mm')}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Icon className="h-3 w-3" />
                        {t(`admin.activities.types.${a.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(0_0%_20%)] hidden sm:table-cell">{a.title}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {a.contactId && (
                          <Link to={`/admin/contacts/${a.contactId}`}>
                            <Badge variant="outline" className="text-[10px] hover:bg-[hsl(0_0%_96%)]">
                              {t('admin.activities.linked.contact')}
                            </Badge>
                          </Link>
                        )}
                        {a.dealId && (
                          <Link to={`/admin/deals/${a.dealId}`}>
                            <Badge variant="outline" className="text-[10px] hover:bg-[hsl(0_0%_96%)]">
                              {t('admin.activities.linked.deal')}
                            </Badge>
                          </Link>
                        )}
                        {a.propertyId && (
                          <Badge variant="outline" className="text-[10px]">
                            {t('admin.activities.linked.property')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[hsl(0_0%_50%)] hidden lg:table-cell">{a.userName}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          {!isLoading && activities.length === 0 && (
            <EmptyState
              icon={ScrollText}
              title={t('admin.activities.empty')}
              description={t('admin.activities.emptyDescription')}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination — same shape as the contacts list. */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[hsl(0_0%_50%)]">
            {t('admin.common.page', { page, totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label={t('admin.common.previous', 'Previous page')}
              title={t('admin.common.previous', 'Previous page')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label={t('admin.common.next', 'Next page')}
              title={t('admin.common.next', 'Next page')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
