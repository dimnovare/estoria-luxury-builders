import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, KeyRound, UserX, UserCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminUsers, useDeleteUser, useUpdateUser, useResetPassword } from '@/hooks/api/useAdminUsers';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const roleBadgeColors: Record<string, string> = {
  Admin: 'bg-primary/20 text-primary border-primary/30',
  Agent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Editor: 'bg-green-500/20 text-green-400 border-green-500/30',
  Marketing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [passwordModal, setPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useAdminUsers(page, search);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.users.title')}</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shrink-0">
          <Link to="/admin/users/new"><Plus className="h-4 w-4 mr-2" />{t('admin.users.addUser')}</Link>
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(0_0%_50%)]" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                className="pl-9 border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]"
              />
            </div>
            <Button type="submit" variant="outline" className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)] shrink-0">
              {t('filters.filters')}
            </Button>
          </form>
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
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.users.fields.fullName')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.users.fields.email')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.users.fields.roles')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.users.fields.languages')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden lg:table-cell">{t('admin.users.lastLogin')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.common.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-20">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">
                    {t('admin.common.loading')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && users.map(u => (
                <TableRow key={u.id} className={`border-[hsl(0_0%_93%)] ${!u.isActive ? 'opacity-50' : ''}`}>
                  <TableCell className="py-2 hidden sm:table-cell">
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[hsl(0_0%_90%)] flex items-center justify-center text-xs text-[hsl(0_0%_50%)]">
                        {u.fullName.charAt(0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <div>{u.fullName}</div>
                    <div className="text-xs text-[hsl(0_0%_50%)] md:hidden">{u.email}</div>
                    <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                      {u.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-[10px] ${roleBadgeColors[role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-[10px] ${roleBadgeColors[role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden lg:table-cell">{(u.languages ?? []).join(', ')}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden lg:table-cell">
                    {u.lastLoginAt ? (
                      <Tooltip>
                        <TooltipTrigger>{formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })}</TooltipTrigger>
                        <TooltipContent>{new Date(u.lastLoginAt).toLocaleString()}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-[hsl(0_0%_70%)] italic">{t('admin.users.neverLoggedIn')}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`text-[10px] ${u.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                      {u.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">
                        <Link to={`/admin/users/${u.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(43_50%_54%)]"
                        onClick={() => { setPasswordModal({ id: u.id, name: u.fullName }); setNewPassword(''); }}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.isActive ? (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                          onClick={() => handleDeactivate(u)}
                          disabled={deleteUser.isPending}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-green-500"
                          onClick={() => handleReactivate(u)}
                          disabled={updateUser.isPending}
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
          {!isLoading && users.length === 0 && (
            <p className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.users.empty')}</p>
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

      {/* Reset Password Modal */}
      <Dialog open={!!passwordModal} onOpenChange={(open) => { if (!open) setPasswordModal(null); }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(0_0%_15%)]">{t('admin.users.actions.resetPassword')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(0_0%_50%)]">{passwordModal?.name}</p>
          <div className="space-y-2">
            <Label className="text-sm text-[hsl(0_0%_40%)] font-medium">{t('admin.users.fields.password')}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)]"
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal(null)} className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]">{t('admin.common.cancel')}</Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || resetPassword.isPending}
              className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]"
            >
              {t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
