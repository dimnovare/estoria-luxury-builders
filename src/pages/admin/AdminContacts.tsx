import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, User, Home, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useContacts, useDeleteContact, useAgents, handleCrmError } from '@/hooks/api/useCrm';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Event', 'Other'];

export default function AdminContacts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: agentsData } = useAgents();
  const agents = agentsData ?? [];

  const filter = {
    search: search || undefined,
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.contacts.title')}</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Link to="/admin/contacts/new"><Plus className="h-4 w-4 mr-2" />{t('admin.contacts.addNew')}</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0_0%_50%)]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin.contacts.searchPlaceholder')}
              className="pl-9 border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
            />
          </div>
          <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
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
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.name')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.email')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.phone')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.contacts.table.tags')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.contacts.table.roles')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.contacts.table.agent')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.contacts.table.lastActivity')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">
                    {t('admin.common.loading')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && contacts.map(c => (
                <TableRow key={c.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="py-2">
                    <div className="h-9 w-9 rounded-full bg-[hsl(43_50%_54%)]/10 border border-[hsl(43_50%_54%)]/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-[hsl(43_50%_54%)]">{getInitials(c.fullName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <Link to={`/admin/contacts/${c.id}`} className="hover:text-[hsl(43_50%_54%)] transition-colors">
                      {c.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{c.email || '—'}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{c.phone || '—'}</TableCell>
                  <TableCell>
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
                  <TableCell>
                    <div className="flex gap-1 text-[hsl(0_0%_50%)]">{roleIcons(c)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{c.assignedAgentName || '—'}</TableCell>
                  <TableCell className="text-xs text-[hsl(0_0%_50%)]">
                    {c.lastActivityAt ? formatDistanceToNow(new Date(c.lastActivityAt), { addSuffix: true }) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">
                        <Link to={`/admin/contacts/${c.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-12 w-12 text-[hsl(0_0%_80%)] mb-4" />
              <p className="text-[hsl(0_0%_50%)] text-sm mb-4">{t('admin.contacts.empty')}</p>
              <Button asChild variant="outline" className="border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)]">
                <Link to="/admin/contacts/new">{t('admin.contacts.addNew')}</Link>
              </Button>
            </div>
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
