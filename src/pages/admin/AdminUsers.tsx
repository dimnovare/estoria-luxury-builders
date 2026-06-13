import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, KeyRound, UserX, UserCheck, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { useAdminUsers, useDeleteUser, useUpdateUser, useResetPassword } from '@/hooks/api/useAdminUsers';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const roleBadgeColors: Record<string, string> = {
  Admin: 'bg-primary/20 text-primary border-primary/30',
  Agent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Editor: 'bg-success/10 text-success border-success/30',
  Marketing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [passwordModal, setPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState<{ id: string; isActive: boolean; email: string; fullName: string; languages: string[]; roles: string[] } | null>(null);

  const { data, isLoading, isError, refetch } = useAdminUsers(page, search);
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();

  const users = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDeactivate = async (user: { id: string; isActive: boolean; email: string; fullName: string; languages: string[]; roles: string[] }) => {
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success(t('admin.users.toast.deactivated'));
    } catch {
      toast.error(t('admin.users.toast.deactivateFailed'));
    }
  };

  const handleReactivate = async (user: { id: string; email: string; fullName: string; languages: string[]; roles: string[] }) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        dto: { email: user.email, fullName: user.fullName, languages: user.languages, roles: user.roles, isActive: true },
      });
      toast.success(t('admin.users.toast.reactivated'));
    } catch {
      toast.error(t('admin.users.toast.reactivateFailed'));
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal || !newPassword) return;
    try {
      await resetPassword.mutateAsync({ id: passwordModal.id, password: newPassword });
      toast.success(t('admin.users.toast.passwordReset'));
      setPasswordModal(null);
      setNewPassword('');
    } catch {
      toast.error(t('admin.users.toast.passwordResetFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.users.title')}
        action={
          <Button asChild className="shrink-0">
            <Link to="/admin/users/new"><Plus className="h-4 w-4 mr-2" />{t('admin.users.addUser')}</Link>
          </Button>
        }
      />

      {/* Search */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                className="pl-9 border-border bg-card text-foreground"
              />
            </div>
            <Button type="submit" variant="outline" className="border-border text-muted-foreground shrink-0">
              {t('filters.filters')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      {isError ? (
        <ErrorState
          description={t('admin.users.loadError', 'We could not load users. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={6} />
            </div>
          ) : (
          <>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs w-12 hidden sm:table-cell"></TableHead>
                <TableHead className="text-muted-foreground text-xs">{t('admin.users.fields.fullName')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">{t('admin.users.fields.email')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.users.fields.roles')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">{t('admin.users.fields.languages')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">{t('admin.users.lastLogin')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.common.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-20">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className={`border-border ${!u.isActive ? 'opacity-50' : ''}`}>
                  <TableCell className="py-2 hidden sm:table-cell">
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {u.fullName.charAt(0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-foreground font-medium">
                    <div>{u.fullName}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{u.email}</div>
                    <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                      {u.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-[10px] ${roleBadgeColors[role] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-[10px] ${roleBadgeColors[role] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{(u.languages ?? []).join(', ')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {u.lastLoginAt ? (
                      <Tooltip>
                        <TooltipTrigger>{formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })}</TooltipTrigger>
                        <TooltipContent>{new Date(u.lastLoginAt).toLocaleString()}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground italic">{t('admin.users.neverLoggedIn')}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`text-[10px] ${u.isActive ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                      {u.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-muted-foreground transition-colors hover:text-foreground">
                        <Link to={`/admin/users/${u.id}/edit`} aria-label={t('admin.common.edit')} title={t('admin.common.edit')}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-9 w-9 text-muted-foreground transition-colors hover:text-primary"
                        onClick={() => { setPasswordModal({ id: u.id, name: u.fullName }); setNewPassword(''); }}
                        aria-label={t('admin.users.actions.resetPassword')}
                        title={t('admin.users.actions.resetPassword')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.isActive ? (
                        <Button
                          variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => setPendingDeactivate(u)}
                          disabled={deleteUser.isPending}
                          aria-label={t('admin.users.actions.deactivate', 'Deactivate user')}
                          title={t('admin.users.actions.deactivate', 'Deactivate user')}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground transition-colors hover:text-success"
                          onClick={() => handleReactivate(u)}
                          disabled={updateUser.isPending}
                          aria-label={t('admin.users.actions.reactivate', 'Reactivate user')}
                          title={t('admin.users.actions.reactivate', 'Reactivate user')}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {users.length === 0 && (
            <EmptyState
              icon={Users}
              title={t('admin.users.empty')}
              description={t('admin.users.emptyDescription', 'Add a user to get started.')}
              action={
                <Button asChild>
                  <Link to="/admin/users/new"><Plus className="h-4 w-4 mr-2" />{t('admin.users.addUser')}</Link>
                </Button>
              }
            />
          )}
          </>
          )}
        </CardContent>
      </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 border-border" aria-label={t('pagination.previous', 'Previous page')} title={t('pagination.previous', 'Previous page')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 border-border" aria-label={t('pagination.next', 'Next page')} title={t('pagination.next', 'Next page')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Reset Password Modal */}
      <Dialog open={!!passwordModal} onOpenChange={(open) => { if (!open) setPasswordModal(null); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('admin.users.actions.resetPassword')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{passwordModal?.name}</p>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground font-medium">{t('admin.users.fields.password')}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="border-border bg-card text-foreground"
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal(null)} className="border-border text-muted-foreground">{t('admin.common.cancel')}</Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || resetPassword.isPending}
            >
              {t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(o) => { if (!o) setPendingDeactivate(null); }}
        onConfirm={() => {
          if (pendingDeactivate) handleDeactivate(pendingDeactivate);
          setPendingDeactivate(null);
        }}
        title={t('admin.users.deactivateTitle', 'Deactivate this user?')}
        description={t(
          'admin.users.deactivateDesc',
          'They will lose access immediately and can no longer sign in. You can reactivate them later.',
        )}
        confirmLabel={t('admin.users.actions.deactivate', 'Deactivate user')}
      />
    </div>
  );
}
