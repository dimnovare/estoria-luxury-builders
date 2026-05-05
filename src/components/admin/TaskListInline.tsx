import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CheckSquare, Plus, MoreVertical, Pencil, Trash2, Contact, Handshake, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { useTasks, useToggleTaskStatus, useDeleteTask, type TaskDto, type TaskPriority } from '@/hooks/api/useTasks';
import { handleCrmError } from '@/hooks/api/useCrm';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO, isBefore } from 'date-fns';
import TaskForm from '@/pages/admin/TaskForm';

const priorityStyles: Record<TaskPriority, string> = {
  Low: 'bg-[hsl(0_0%_90%)] text-[hsl(0_0%_45%)]',
  Normal: 'bg-[hsl(0_0%_20%)] text-[hsl(0_0%_95%)]',
  High: 'bg-[hsl(43_50%_54%)]/20 text-[hsl(43_50%_44%)]',
};

interface TaskListInlineProps {
  contactId?: string;
  dealId?: string;
  propertyId?: string;
}

/**
 * Reusable inline task list for ContactDetail / DealDetail / PropertyDetail.
 * Shows tasks linked to a specific entity with checkbox toggle + new task button.
 */
export default function TaskListInline({ contactId, dealId, propertyId }: TaskListInlineProps) {
  const { t } = useTranslation();

  const { data } = useTasks({ contactId, dealId, propertyId, pageSize: 100 });
  const toggleStatus = useToggleTaskStatus();
  const deleteMutation = useDeleteTask();

  const [showForm, setShowForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const tasks = data?.items ?? [];

  const handleToggle = (task: TaskDto) => {
    toggleStatus.mutate(
      { id: task.id, status: task.status === 'Pending' ? 'Done' : 'Pending' },
      { onError: () => toast.error(t('admin.tasks.toast.toggleFailed')) }
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('admin.tasks.toast.deleted'));
      setDeleteConfirm(null);
    } catch (err) {
      handleCrmError(err, t('admin.tasks.toast.deleteFailed'));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)]"
          onClick={() => { setEditTaskId(undefined); setShowForm(true); }}
        >
          <Plus className="h-4 w-4 mr-1" />{t('admin.tasks.addNew')}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={t('admin.tasks.empty')}
          description={t('admin.tasks.emptyDescription')}
        />
      ) : (
        tasks.map(task => {
          const due = parseISO(task.dueAt);
          const isLate = isBefore(due, new Date()) && task.status === 'Pending';
          return (
            <Card key={task.id} className={`bg-white border-[hsl(0_0%_90%)] shadow-sm ${task.status === 'Done' ? 'opacity-50' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox
                  checked={task.status === 'Done'}
                  onCheckedChange={() => handleToggle(task)}
                  className="border-[hsl(0_0%_70%)] data-[state=checked]:bg-[hsl(43_50%_54%)] data-[state=checked]:border-[hsl(43_50%_54%)]"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${task.status === 'Done' ? 'line-through text-[hsl(0_0%_60%)]' : 'font-medium text-[hsl(0_0%_15%)]'}`}>
                    {task.title}
                  </span>
                </div>
                <Badge className={`text-[10px] ${priorityStyles[task.priority]}`}>{t(`admin.tasks.priority.${task.priority}`)}</Badge>
                <span className={`text-xs whitespace-nowrap ${isLate ? 'text-red-500 font-medium' : 'text-[hsl(0_0%_50%)]'}`}>
                  {formatDistanceToNow(due, { addSuffix: true })}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(0_0%_50%)]">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditTaskId(task.id); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />{t('admin.common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => setDeleteConfirm(task.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />{t('admin.common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          );
        })
      )}

      {showForm && (
        <TaskForm
          taskId={editTaskId}
          open={showForm}
          onClose={() => { setShowForm(false); setEditTaskId(undefined); }}
          defaultContactId={contactId}
          defaultDealId={dealId}
          defaultPropertyId={propertyId}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.tasks.confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.tasks.confirmDeleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteMutation.isPending}>
              {t('admin.common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
