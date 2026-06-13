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
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTasks, useToggleTaskStatus, useDeleteTask, type TaskDto, type TaskPriority } from '@/hooks/api/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleCrmError } from '@/hooks/api/useCrm';
import { formatDistanceToNow, isToday, isThisWeek, isBefore, startOfDay, addDays, parseISO } from 'date-fns';
import TaskForm from './TaskForm';

const priorityStyles: Record<TaskPriority, string> = {
  Low: 'bg-muted text-muted-foreground',
  Normal: 'bg-secondary text-secondary-foreground',
  High: 'bg-primary/20 text-primary',
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

  const { data, isLoading, isError, refetch } = useTasks(filter as never);
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
      <AdminPageHeader
        title={t('admin.tasks.title')}
        subtitle={t('admin.tasks.subtitle', 'Manage to-do items for yourself and team members. Set due dates and reminders.')}
        action={
          <Button
            onClick={() => { setEditTaskId(undefined); setShowForm(true); }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />{t('admin.tasks.addNew', 'New Task')}
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <div className="flex flex-wrap items-center gap-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="today">{t('admin.tasks.tabs.today')}</TabsTrigger>
            <TabsTrigger value="week">{t('admin.tasks.tabs.week')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('admin.tasks.tabs.overdue')}</TabsTrigger>
            <TabsTrigger value="all">{t('admin.tasks.tabs.all')}</TabsTrigger>
          </TabsList>

          {/* Status filter — Pending / Completed / All */}
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(['pending', 'done', 'all'] as StatusFilter[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                } border-r last:border-r-0 border-border`}
              >
                {s === 'pending' ? t('admin.tasks.status.pending') : s === 'done' ? t('admin.tasks.status.done') : t('admin.tasks.status.all')}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="w-[140px] bg-card border-border text-sm text-foreground">
                <SelectValue placeholder={t('admin.tasks.filters.assignedTo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">{t('admin.tasks.filters.me')}</SelectItem>
                <SelectItem value="all">{t('admin.tasks.filters.everyone')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px] bg-card border-border text-sm text-foreground">
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
              <SelectTrigger className="w-[140px] bg-card border-border text-sm text-foreground">
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
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <ErrorState
          description={t('admin.tasks.loadError', 'Could not load tasks.')}
          onRetry={() => refetch()}
        />
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
              <Card key={task.id} className={`bg-card border-border shadow-sm ${task.status === 'Done' ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'Done'}
                    onCheckedChange={() => handleToggle(task)}
                    className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                    </div>
                    {ctx && (
                      <Link to={ctx.to} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5">
                        <ctx.icon className="h-3 w-3" />
                        {ctx.label}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] ${priorityStyles[task.priority]}`}>{t(`admin.tasks.priority.${task.priority}`)}</Badge>
                    <span className={`text-xs whitespace-nowrap ${due.isLate ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {due.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={t('admin.tasks.taskActions', 'Task actions')} title={t('admin.tasks.taskActions', 'Task actions')}>
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
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(task.id)}>
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label={t('admin.tasks.newTitle', 'New task')}
        title={t('admin.tasks.newTitle', 'New task')}
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
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); }}
        title={t('admin.tasks.confirmDelete')}
        description={t('admin.tasks.confirmDeleteDesc')}
      />
    </div>
  );
}
