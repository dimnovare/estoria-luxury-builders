import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, MoreVertical, Pencil, CalendarClock, Trash2, CheckSquare,
  Contact, Handshake, Building2, Loader2, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { useTasks, useToggleTaskStatus, useDeleteTask, type TaskDto, type TaskPriority } from '@/hooks/api/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleCrmError } from '@/hooks/api/useCrm';
import { formatDistanceToNow, isToday, isThisWeek, isBefore, startOfDay, addDays, parseISO } from 'date-fns';
import TaskForm from './TaskForm';

const priorityStyles: Record<TaskPriority, string> = {
  Low: 'bg-[hsl(0_0%_90%)] text-[hsl(0_0%_45%)]',
  Normal: 'bg-[hsl(0_0%_20%)] text-[hsl(0_0%_95%)]',
  High: 'bg-[hsl(43_50%_54%)]/20 text-[hsl(43_50%_44%)]',
};

type TabValue = 'today' | 'week' | 'overdue' | 'all';
type StatusFilter = 'pending' | 'done' | 'all';

export default function AdminTasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabValue>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [assignedTo, setAssignedTo] = useState<string>(user?.id ?? 'me');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [hasReminder, setHasReminder] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Tasks kept visible for 800ms after being marked done so the user can undo.
  const [recentlyDone, setRecentlyDone] = useState<Record<string, TaskDto>>({});
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const toggleStatus = useToggleTaskStatus();
  const deleteMutation = useDeleteTask();

  const filter = useMemo(() => {
    const f: Record<string, unknown> = {
      // 'all' = no filter (Radix Select rejects empty strings); 'me' = caller.
      assignedToId: assignedTo === 'me' ? user?.id : (assignedTo === 'all' ? undefined : assignedTo) || undefined,
      status: statusFilter === 'pending' ? 'Pending' : statusFilter === 'done' ? 'Done' : undefined,
      pageSize: 200,
    };
    if (priorityFilter !== 'all') f.priority = priorityFilter;
    if (hasReminder === 'yes') f.hasReminder = true;
    if (tab === 'overdue') f.overdue = true;
    if (tab === 'today') f.dueBefore = addDays(startOfDay(new Date()), 1).toISOString();
    if (tab === 'week') f.dueBefore = addDays(startOfDay(new Date()), 7).toISOString();
    return f;
  }, [tab, statusFilter, assignedTo, priorityFilter, hasReminder, user?.id]);

  const { data, isLoading } = useTasks(filter as never);
  const tasks = data?.items ?? [];

  // Client-side re-filter for "today" tab; also merge in recently-done tasks so
  // they stay visible for 800ms and can be undone before disappearing.
  const filtered = useMemo(() => {
    // Tasks from query
    let base = tasks;
    if (tab === 'today') base = tasks.filter(t => isToday(parseISO(t.dueAt)) || isBefore(parseISO(t.dueAt), new Date()));
    else if (tab === 'week') base = tasks.filter(t => isThisWeek(parseISO(t.dueAt), { weekStartsOn: 1 }) || isBefore(parseISO(t.dueAt), new Date()));
    else if (tab === 'overdue') base = tasks.filter(t => isBefore(parseISO(t.dueAt), new Date()) && t.status === 'Pending');

    // Merge in recently-done tasks that the query has already excluded
    const baseIds = new Set(base.map(t => t.id));
    const extra = Object.values(recentlyDone).filter(t => !baseIds.has(t.id));
    return [...base, ...extra];
  }, [tasks, tab, recentlyDone]);

  const handleToggle = (task: TaskDto) => {
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';

    if (newStatus === 'Done') {
      // Keep task visible for 800ms so the user can undo before it disappears.
      setRecentlyDone(prev => ({ ...prev, [task.id]: { ...task, status: 'Done' } }));

      const timerId = setTimeout(() => {
        setRecentlyDone(prev => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        undoTimers.current.delete(task.id);
      }, 800);
      undoTimers.current.set(task.id, timerId);

      toast(t('admin.tasks.toast.markedDone'), {
        action: {
          label: t('admin.common.undo'),
          onClick: () => {
            // Cancel the 800ms removal
            const tid = undoTimers.current.get(task.id);
            if (tid) { clearTimeout(tid); undoTimers.current.delete(task.id); }
            setRecentlyDone(prev => {
              const next = { ...prev };
              delete next[task.id];
              return next;
            });
            toggleStatus.mutate(
              { id: task.id, status: 'Pending' },
              { onError: () => toast.error(t('admin.tasks.toast.toggleFailed')) }
            );
          },
        },
      });
    }

    toggleStatus.mutate(
      { id: task.id, status: newStatus },
      {
        onError: () => toast.error(t('admin.tasks.toast.toggleFailed')),
      }
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

  const getDueLabel = (dueAt: string) => {
    const due = parseISO(dueAt);
    const now = new Date();
    if (isBefore(due, now)) {
      return { label: formatDistanceToNow(due, { addSuffix: false }) + ' ' + t('admin.tasks.late'), isLate: true };
    }
    return { label: formatDistanceToNow(due, { addSuffix: true }), isLate: false };
  };

  const getContextLink = (task: TaskDto) => {
    if (task.contactId) return { to: `/admin/contacts/${task.contactId}`, label: task.contactName, icon: Contact };
    if (task.dealId) return { to: `/admin/deals/${task.dealId}`, label: task.dealTitle, icon: Handshake };
    if (task.propertyId) return { to: `/admin/properties/${task.propertyId}/edit`, label: task.propertyTitle, icon: Building2 };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.tasks.title')}</h1>
          <p className="text-sm text-[hsl(0_0%_45%)] mt-1">Manage to-do items for yourself and team members. Set due dates and reminders.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <div className="flex flex-wrap items-center gap-4">
          <TabsList className="bg-[hsl(0_0%_95%)]">
            <TabsTrigger value="today">{t('admin.tasks.tabs.today')}</TabsTrigger>
            <TabsTrigger value="week">{t('admin.tasks.tabs.week')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('admin.tasks.tabs.overdue')}</TabsTrigger>
            <TabsTrigger value="all">{t('admin.tasks.tabs.all')}</TabsTrigger>
          </TabsList>

          {/* Status filter — Pending / Completed / All */}
          <div className="flex rounded-md border border-[hsl(0_0%_88%)] overflow-hidden text-xs">
            {(['pending', 'done', 'all'] as StatusFilter[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 transition-colors ${
                  statusFilter === s
                    ? 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] font-medium'
                    : 'bg-white text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_97%)]'
                } border-r last:border-r-0 border-[hsl(0_0%_88%)]`}
              >
                {s === 'pending' ? t('admin.tasks.status.pending') : s === 'done' ? t('admin.tasks.status.done') : t('admin.tasks.status.all')}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="w-[140px] bg-white border-[hsl(0_0%_85%)] text-sm text-[hsl(0_0%_20%)]">
                <SelectValue placeholder={t('admin.tasks.filters.assignedTo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">{t('admin.tasks.filters.me')}</SelectItem>
                <SelectItem value="all">{t('admin.tasks.filters.everyone')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px] bg-white border-[hsl(0_0%_85%)] text-sm text-[hsl(0_0%_20%)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.tasks.filters.allPriorities')}</SelectItem>
                <SelectItem value="Low">{t('admin.tasks.priority.Low')}</SelectItem>
                <SelectItem value="Normal">{t('admin.tasks.priority.Normal')}</SelectItem>
                <SelectItem value="High">{t('admin.tasks.priority.High')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hasReminder} onValueChange={setHasReminder}>
              <SelectTrigger className="w-[140px] bg-white border-[hsl(0_0%_85%)] text-sm text-[hsl(0_0%_20%)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.tasks.filters.anyReminder')}</SelectItem>
                <SelectItem value="yes">{t('admin.tasks.filters.hasReminder')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Tabs>

      {/* Task list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(43_50%_54%)]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={t('admin.tasks.empty')}
          description={t('admin.tasks.emptyDescription')}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const due = getDueLabel(task.dueAt);
            const ctx = getContextLink(task);
            return (
              <Card key={task.id} className={`bg-white border-[hsl(0_0%_90%)] shadow-sm ${task.status === 'Done' ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'Done'}
                    onCheckedChange={() => handleToggle(task)}
                    className="mt-0.5 border-[hsl(0_0%_70%)] data-[state=checked]:bg-[hsl(43_50%_54%)] data-[state=checked]:border-[hsl(43_50%_54%)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-[hsl(0_0%_60%)]' : 'text-[hsl(0_0%_15%)]'}`}>
                        {task.title}
                      </span>
                    </div>
                    {ctx && (
                      <Link to={ctx.to} className="flex items-center gap-1 text-xs text-[hsl(0_0%_50%)] hover:text-[hsl(43_50%_54%)] mt-0.5">
                        <ctx.icon className="h-3 w-3" />
                        {ctx.label}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] ${priorityStyles[task.priority]}`}>{t(`admin.tasks.priority.${task.priority}`)}</Badge>
                    <span className={`text-xs whitespace-nowrap ${due.isLate ? 'text-red-500 font-medium' : 'text-[hsl(0_0%_50%)]'}`}>
                      {due.label}
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
                        <DropdownMenuItem onClick={() => { setEditTaskId(task.id); setShowForm(true); }}>
                          <CalendarClock className="h-3.5 w-3.5 mr-2" />{t('admin.tasks.reschedule')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => setDeleteConfirm(task.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />{t('admin.common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditTaskId(undefined); setShowForm(true); }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] shadow-lg flex items-center justify-center transition-colors z-40"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          taskId={editTaskId}
          open={showForm}
          onClose={() => { setShowForm(false); setEditTaskId(undefined); }}
        />
      )}

      {/* Delete confirmation */}
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
