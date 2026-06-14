import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AxiosError } from 'axios';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  languages: string[];
  roles: string[];
  teamMemberId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface UserListResponse {
  items: AdminUser[];
  totalCount: number;
}

interface CreateUserDto {
  email: string;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  languages: string[];
  roles: string[];
  teamMemberId?: string;
  password: string;
}

interface UpdateUserDto {
  email: string;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  languages: string[];
  roles: string[];
  teamMemberId?: string;
  isActive?: boolean;
}

export function useAdminUsers(page = 1, search = '') {
  return useQuery<UserListResponse>({
    queryKey: ['admin', 'users', page, search],
    queryFn: () =>
      api.get('/admin/users', { params: { page, pageSize: 20, search: search || undefined } }).then(r => r.data),
  });
}

export function useAdminUser(id?: string) {
  return useQuery<AdminUser>({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.get(`/admin/users/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, AxiosError, CreateUserDto>({
    mutationFn: (dto) => api.post('/admin/users', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation<void, AxiosError, { id: string; dto: UpdateUserDto }>({
    mutationFn: ({ id, dto }) => api.put(`/admin/users/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', vars.id] });
    },
  });
}

export function useResetPassword() {
  return useMutation<void, AxiosError, { id: string; password: string }>({
    mutationFn: ({ id, password }) =>
      api.put(`/admin/users/${id}/password`, { newPassword: password }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
