import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, User, Home, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useContacts, useDeleteContact, useAgents, handleCrmError } from '@/hooks/api/useCrm';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Event', 'Other'];

export default function AdminContacts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [agentFilter, setAgentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: agentsData } = useAgents();
  const agents = agentsData ?? [];

  const filter = {
    search: debouncedSearch || undefined,
    agentId: agentFilter !== 'all' ? agentFilter : undefined,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    isBuyer: roleFilter === 'buyer' ? true : undefined,
    isSeller: roleFilter === 'seller' ? true : undefined,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useContacts(filter);
  const deleteMutation = useDeleteContact();

  const contacts = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(t('admin.contacts.toast.deleted'));
    } catch (err) {
      handleCrmError(err, t('admin.contacts.toast.deleteFailed'));
    }
    setDeleteId(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleIcons = (c: typeof contacts[0]) => {
    const icons = [];
    if (c.isBuyer) icons.push(<span key="b" title={t('admin.contacts.roles.buyer')}><Eye className="h-3.5 w-3.5" /></span>);
    if (c.isSeller) icons.push(<span key="s" title={t('admin.contacts.roles.seller')}><Home className="h-3.5 w-3.5" /></span>);
    if (c.isTenant) icons.push(<span key="t" title={t('admin.contacts.roles.tenant')}><User className="h-3.5 w-3.5" /></span>);
    if (c.isLandlord) icons.push(<span key="l" title={t('admin.contacts.roles.landlord')}><Home className="h-3.5 w-3.5 text-[hsl(43_50%_54%)]" /></span>);
    return icons;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.contacts.title')}
        subtitle={t('admin.contacts.subtitle', 'CRM contact list. Contacts can be linked to deals and email threads.')}
        action={
          <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shrink-0">
            <Link to="/admin/contacts/new"><Plus className="h-4 w-4 mr-2" />{t('admin.contacts.addNew')}</Link>
          </Button>
        }
      />

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0_0%_50%)]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin.contacts.searchPlaceholder')}
              className="pl-9 border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
                <SelectValue placeholder={t('admin.contacts.filters.agent')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.common.all')}</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
                <SelectValue placeholder={t('admin.contacts.filters.source')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.common.all')}</SelectItem>
                {SOURCES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {(['all', 'buyer', 'seller'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-nav uppercase tracking-wider rounded-full border transition-colors ${
                    roleFilter === r
                      ? 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] border-[hsl(43_50%_54%)]'
                      : 'border-[hsl(0_0%_85%)] text-[hsl(0_0%_50%)] hover:border-[hsl(0_0%_70%)]'
                  }`}
                >
                  {t(`admin.contacts.filters.${r}`)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12 hidden sm:table-cell"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.name')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.common.email')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.common.phone')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.contacts.table.tags')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.contacts.table.roles')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden xl:table-cell">{t('admin.contacts.table.agent')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden xl:table-cell">{t('admin.contacts.table.lastActivity')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="py-2 hidden sm:table-cell"><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && contacts.map(c => (
                <TableRow key={c.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="py-2 hidden sm:table-cell">
                    <div className="h-9 w-9 rounded-full bg-[hsl(43_50%_54%)]/10 border border-[hsl(43_50%_54%)]/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-[hsl(43_50%_54%)]">{getInitials(c.fullName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <Link to={`/admin/contacts/${c.id}`} className="hover:text-[hsl(43_50%_54%)] transition-colors">
                      {c.fullName}
                    </Link>
                    <div className="text-xs text-[hsl(0_0%_50%)] md:hidden">{c.email || ''}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{c.email || '—'}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden lg:table-cell">{c.phone || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] bg-[hsl(43_50%_54%)]/10 text-[hsl(43_50%_44%)] border-[hsl(43_50%_54%)]/30">
                          {tag}
                        </Badge>
                      ))}
                      {(c.tags ?? []).length > 3 && (
                        <span className="text-[10px] text-[hsl(0_0%_50%)]">+{c.tags.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex gap-1 text-[hsl(0_0%_50%)]">{roleIcons(c)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden xl:table-cell">{c.assignedAgentName || '—'}</TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)] hidden xl:table-cell">
                    {c.lastActivityAt ? formatDistanceToNow(new Date(c.lastActivityAt), { addSuffix: true }) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-[hsl(0_0%_20%)]">
                        <Link to={`/admin/contacts/${c.id}/edit`} aria-label={t('admin.common.edit')} title={t('admin.common.edit')}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_45%)] hover:text-red-500" onClick={() => setDeleteId(c.id)} aria-label={t('admin.common.delete')} title={t('admin.common.delete')}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {!isLoading && contacts.length === 0 && (
            <EmptyState
              icon={User}
              title={t('admin.contacts.empty')}
              description={t('admin.contacts.emptyDescription')}
              action={
                <Button asChild variant="outline" className="border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)]">
                  <Link to="/admin/contacts/new"><Plus className="h-4 w-4 mr-1" />{t('admin.contacts.addNew')}</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded text-sm ${
                p === page
                  ? 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)]'
                  : 'text-[hsl(0_0%_50%)] hover:bg-[hsl(0_0%_95%)]'
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
            <DialogTitle>{t('admin.contacts.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.contacts.confirmDeleteDesc')}</p>
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
