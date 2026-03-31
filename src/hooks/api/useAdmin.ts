import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ── Language key helpers ───────────────────────────────────────────────────────
// Frontend form uses 'et'/'en'/'ru'; backend uses 'Et'/'En'/'Ru'
export const toBeLang = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);
export const toFeLang = (l: string) => l.toLowerCase();

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminPropertyTranslation {
  title: string;
  description: string;
  address: string;
  city: string;
  district?: string;
}

export interface AdminPropertyImage {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface AdminProperty {
  id: string;
  slug: string;
  price: number;
  currency: string;
  size: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  energyClass?: string;
  latitude?: number;
  longitude?: number;
  isFeatured: boolean;
  propertyType: string;
  transactionType: string;
  status: string;
  coverImageUrl?: string;
  createdAt: string;
  agent: { id: string; name: string; slug: string; role: string; };
  translations: Record<string, AdminPropertyTranslation>;
  images: AdminPropertyImage[];
  features: string[];
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  translations: Record<string, {
    title: string;
    excerpt?: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}

export interface AdminTeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  photoUrl?: string;
  phone: string;
  email: string;
  languages: string[];
}

export interface AdminService {
  id: string;
  slug: string;
  iconName?: string;
  name: string;
  description: string;
  priceInfo?: string;
}

export interface AdminCareer {
  id: string;
  slug: string;
  title: string;
  location?: string;
  isActive: boolean;
}

export interface AdminPage {
  id: string;
  pageKey: string;
  translations: Record<string, {
    title?: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
  }>;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  status: string;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  language: string;
  isActive: boolean;
  subscribedAt: string;
}

// ── Properties ─────────────────────────────────────────────────────────────────

export function useAdminProperties(page = 1) {
  return useQuery<{ items: AdminProperty[]; totalCount: number }>({
    queryKey: ['admin', 'properties', page],
    queryFn: () =>
      api.get('/admin/properties', { params: { page, pageSize: 20 } }).then(r => r.data),
  });
}

export function useAdminProperty(id?: string) {
  return useQuery<AdminProperty>({
    queryKey: ['admin', 'property', id],
    queryFn: () => api.get(`/admin/properties/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/properties', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'properties'] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/properties/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      qc.invalidateQueries({ queryKey: ['admin', 'property', vars.id] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'properties'] }),
  });
}

export function useUploadPropertyImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: FileList | File[] }) => {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('files', f));
      return api.post(`/admin/properties/${id}/images`, form).then(r => r.data);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'property', vars.id] }),
  });
}

export function useDeletePropertyImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, imageId }: { propertyId: string; imageId: string }) =>
      api.delete(`/admin/properties/${propertyId}/images/${imageId}`),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'property', vars.propertyId] }),
  });
}

// ── Blog ───────────────────────────────────────────────────────────────────────

export function useAdminBlogPosts(page = 1) {
  return useQuery<{ items: AdminBlogPost[]; totalCount: number }>({
    queryKey: ['admin', 'blog', page],
    queryFn: () =>
      api.get('/admin/blog', { params: { page, pageSize: 20 } }).then(r => r.data),
  });
}

export function useAdminBlogPost(id?: string) {
  return useQuery<AdminBlogPost>({
    queryKey: ['admin', 'blog-post', id],
    queryFn: () => api.get(`/admin/blog/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/blog', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'blog'] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/blog/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['admin', 'blog-post', vars.id] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'blog'] }),
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) => {
      const form = new FormData();
      form.append('file', file);
      return api
        .post('/admin/upload', form, { params: { folder: folder ?? 'misc' } })
        .then(r => r.data as { url: string });
    },
  });
}

// ── Team ───────────────────────────────────────────────────────────────────────

export function useAdminTeam() {
  return useQuery<AdminTeamMember[]>({
    queryKey: ['admin', 'team'],
    queryFn: () => api.get('/admin/team').then(r => r.data),
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/team', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/team/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/team/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }),
  });
}

export function useUploadTeamPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return api
        .post(`/admin/team/${id}/photo`, form)
        .then(r => r.data as { url: string });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }),
  });
}

// ── Services ───────────────────────────────────────────────────────────────────

export function useAdminServices() {
  return useQuery<AdminService[]>({
    queryKey: ['admin', 'services'],
    queryFn: () => api.get('/admin/services').then(r => r.data),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/services', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/services/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });
}

// ── Careers ────────────────────────────────────────────────────────────────────

export function useAdminCareers() {
  return useQuery<AdminCareer[]>({
    queryKey: ['admin', 'careers'],
    queryFn: () => api.get('/admin/careers').then(r => r.data),
  });
}

export function useCreateCareer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/careers', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'careers'] }),
  });
}

export function useUpdateCareer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/careers/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'careers'] }),
  });
}

export function useDeleteCareer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/careers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'careers'] }),
  });
}

// ── Pages ──────────────────────────────────────────────────────────────────────

export function useAdminPages() {
  return useQuery<AdminPage[]>({
    queryKey: ['admin', 'pages'],
    queryFn: () => api.get('/admin/pages').then(r => r.data),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/pages/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  });
}

// ── Contacts ───────────────────────────────────────────────────────────────────

export function useAdminContacts(page = 1) {
  return useQuery<{ items: ContactMessage[]; totalCount: number }>({
    queryKey: ['admin', 'contacts', page],
    queryFn: () =>
      api.get('/admin/contacts', { params: { page, pageSize: 20 } }).then(r => r.data),
  });
}

export function useUpdateContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/contacts/${id}/status`, JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contacts'] }),
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  properties: number;
  blogPosts: number;
  teamMembers: number;
  unreadMessages: number;
  subscribers: number;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });
}

// ── Newsletter ─────────────────────────────────────────────────────────────────

export function useAdminSubscribers(page = 1) {
  return useQuery<{ items: Subscriber[]; totalCount: number }>({
    queryKey: ['admin', 'subscribers', page],
    queryFn: () =>
      api
        .get('/admin/newsletter/subscribers', { params: { page, pageSize: 50 } })
        .then(r => r.data),
  });
}

export function useUnsubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/newsletter/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] }),
  });
}
