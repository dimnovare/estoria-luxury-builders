import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, UserPlus, Briefcase, CheckCheck, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAdminContacts, useUpdateContactStatus, useDeleteContactMessage, type ContactMessage } from '@/hooks/api/useAdmin';
import { contactStatusLabel } from '@/lib/enumLabels';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  New: 'bg-[hsl(43_50%_90%)] text-[hsl(43_50%_40%)] border-[hsl(43_50%_70%)]',
  Read: 'bg-blue-100 text-blue-700 border-blue-200',
  Replied: 'bg-green-100 text-green-700 border-green-200',
};

const actionBtnClass =
  'inline-flex items-center gap-1.5 text-sm text-[hsl(0_0%_30%)] hover:text-[hsl(43_50%_45%)] transition-colors';

export default function AdminMessages() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminContacts();
  const updateStatus = useUpdateContactStatus();
  const deleteMsg = useDeleteContactMessage();

  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const messages = data?.items ?? [];

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(t('admin.messages.toast.marked', { status: contactStatusLabel(status, t) }));
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    } catch {
      toast.error(t('admin.messages.toast.updateFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMsg.mutateAsync(id);
      toast.success(t('admin.messages.toast.deleted', { defaultValue: 'Message deleted' }));
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error(t('admin.messages.toast.deleteFailed', { defaultValue: 'Failed to delete message' }));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.messages.title')}</h1>
      <p className="text-sm text-[hsl(0_0%_45%)] mt-1 mb-4">{t('admin.messages.subtitle', 'Contact form submissions from the public website. Mark as Read once followed up.')}</p>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.name')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.common.email')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.messages.table.subject')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.common.date')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell>
                </TableRow>
              )}
              {!isLoading && messages.map(m => (
                <TableRow
                  key={m.id}
                  className="border-[hsl(0_0%_93%)] cursor-pointer hover:bg-[hsl(0_0%_98%)]"
                  onClick={() => setSelected(m)}
                >
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    <div>{m.name}</div>
                    <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{m.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden sm:table-cell">{m.email}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_30%)] hidden md:table-cell truncate max-w-[200px]">{m.subject}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)] hidden sm:table-cell whitespace-nowrap">
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[m.status] ?? ''}`}>
                      {contactStatusLabel(m.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-[hsl(0_0%_45%)] hover:text-red-600 hover:bg-red-50"
                      disabled={deleteMsg.isPending}
                      onClick={() => setPendingDelete(m.id)}
                      aria-label={t('admin.common.delete')}
                      title={t('admin.common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && messages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.messages.empty')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg bg-white border-[hsl(0_0%_90%)]">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[hsl(0_0%_15%)]">{selected.subject || t('common.noSubject')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[hsl(0_0%_50%)]">{t('admin.messages.dialog.from')}</span> <span className="text-[hsl(0_0%_20%)] font-medium">{selected.name}</span></div>
                  <div><span className="text-[hsl(0_0%_50%)]">{t('admin.messages.dialog.email')}</span> <a href={`mailto:${selected.email}`} className="text-[hsl(43_50%_54%)] hover:underline break-all">{selected.email}</a></div>
                  {selected.phone && (
                    <div><span className="text-[hsl(0_0%_50%)]">{t('admin.messages.dialog.phone')}</span> <span className="text-[hsl(0_0%_20%)]">{selected.phone}</span></div>
                  )}
                  <div><span className="text-[hsl(0_0%_50%)]">{t('admin.messages.dialog.date')}</span> <span className="text-[hsl(0_0%_20%)]">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '—'}</span></div>
                </div>
                {selected.propertyTitle && (
                  <div className="text-sm">
                    <span className="text-[hsl(0_0%_50%)]">{t('admin.messages.dialog.property')}</span>{' '}
                    <span className="text-[hsl(43_50%_54%)]">{selected.propertyTitle}</span>
                  </div>
                )}
                <div className="bg-[hsl(0_0%_97%)] rounded-lg p-4 text-sm text-[hsl(0_0%_25%)] leading-relaxed">
                  {selected.message}
                </div>

                {/* CRM quick-actions */}
                <div className="border-t border-[hsl(0_0%_92%)] pt-3 flex flex-wrap gap-4">
                  <Link
                    to={`/admin/contacts/new?name=${encodeURIComponent(selected.name)}&email=${encodeURIComponent(selected.email)}&phone=${encodeURIComponent(selected.phone ?? '')}`}
                    className={actionBtnClass}
                    onClick={() => setSelected(null)}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('admin.messages.actions.createContact', { defaultValue: 'Create Contact' })}
                  </Link>
                  <Link
                    to={`/admin/deals?new=1&title=${encodeURIComponent(`Enquiry from ${selected.name}`)}`}
                    className={actionBtnClass}
                    onClick={() => setSelected(null)}
                  >
                    <Briefcase className="h-4 w-4" />
                    {t('admin.messages.actions.createDeal', { defaultValue: 'Create Deal' })}
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  {selected.status === 'Read' ? (
                    <Button
                      variant="outline"
                      className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)] text-sm"
                      disabled={updateStatus.isPending}
                      onClick={() => handleStatusUpdate(selected.id, 'New')}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      {t('admin.messages.markUnread', { defaultValue: 'Mark Unread' })}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)] text-sm"
                      disabled={updateStatus.isPending}
                      onClick={() => handleStatusUpdate(selected.id, 'Read')}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      {t('admin.messages.markRead')}
                    </Button>
                  )}
                  {selected.status !== 'Replied' && (
                    <Button
                      className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] text-sm"
                      disabled={updateStatus.isPending}
                      onClick={() => handleStatusUpdate(selected.id, 'Replied')}
                    >
                      {t('admin.messages.markReplied')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        title={t('admin.messages.confirmDeleteTitle', 'Delete this message?')}
        description={t('admin.messages.confirmDeleteDesc', 'This permanently removes the enquiry from your inbox. This action cannot be undone.')}
      />
    </div>
  );
}
