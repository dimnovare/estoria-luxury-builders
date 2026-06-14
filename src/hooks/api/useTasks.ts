import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { handleCrmError } from './useCrm';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TaskPriority = 'Low' | 'Normal' | 'High';
export type TaskStatus = 'Pending' | 'Done' | 'Cancelled';
export type TaskRecurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly'; // TODO: P2.6 recurrence engine

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  dueAt: string;
  reminderAt?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToUserId: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  dealTitle?: string;
  propertyId?: string;
  propertyTitle?: string;
  recurrence: TaskRecurrence;
  completedAt?: string;
  createdAt: string;
}

export interface TaskFilter {
  assignedToId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  hasReminder?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  contactId?: string;
  dealId?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueAt: string;
  reminderAt?: string;
  priority: TaskPriority;
  assignedToUserId: string;
  contactId?: string;
  dealId?: string;
  propertyId?: string;
  recurrence?: TaskRecurrence;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useTasks(filter: TaskFilter = {}) {
  return useQuery<{ items: TaskDto[]; totalCount: number }>({
    queryKey: ['tasks', filter],
    queryFn: () =>
      api.get('/admin/tasks', { params: { ...filter } }).then(r => {
        const items = r.data?.items ?? r.data ?? [];
        return { items, totalCount: r.data?.totalCount ?? items.length };
      }),
  });
}

export function useTask(id?: string) {
  return useQuery<TaskDto>({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => api.get(`/admin/tasks/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

/** Lightweight query for the sidebar badge — overdue task count */
export function useOverdueTaskCount() {
  return useQuery<number>({
    queryKey: ['tasks', 'overdue-count'],
    queryFn: async () => {
      const r = await api.get('/admin/tasks/mine', {
        params: { status: 'Pending', overdue: true, pageSize: 0 },
      });
      return r.data?.totalCount ?? (r.data?.items ?? r.data ?? []).length;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) =>
      api.post('/admin/tasks', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateTaskDto> }) =>
      api.put(`/admin/tasks/${id}`, dto).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Optimistic "mark done / reopen" — flips status immediately, reverts on error.
 */
export function useToggleTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.put(`/admin/tasks/${id}/status`, { status }).then(r => r.data),
    onMutate: async (vars) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['tasks'] });
      // Snapshot all task list queries for rollback
      const cache = qc.getQueriesData<{ items: TaskDto[]; totalCount: number }>({ queryKey: ['tasks'] });
      // Optimistically update every list
      cache.forEach(([key, data]) => {
        if (data?.items) {
          qc.setQueryData(key, {
            ...data,
            items: data.items.map(t =>
              t.id === vars.id
                ? { ...t, status: vars.status, completedAt: vars.status === 'Done' ? new Date().toISOString() : undefined }
                : t
            ),
          });
        }
      });
      return { cache };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback
      ctx?.cache?.forEach(([key, data]) => {
        if (data) qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
