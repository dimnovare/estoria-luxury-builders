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

export type AdminImageProcessingStatus = 'Pending' | 'Processing' | 'Done' | 'Failed';

export interface AdminPropertyImage {
  id: string;
  url: string;
  thumbUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  processingStatus?: AdminImageProcessingStatus;
  processingError?: string;
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

/// Full admin-edit shape returned by GET /admin/team/{id}. Translations are
/// keyed PascalCase ('Et' | 'En' | 'Ru') to mirror the backend DTO directly.
export interface AdminTeamMemberDetail {
  id: string;
  slug: string;
  photoUrl?: string;
  phone: string;
  email: string;
  languages: string[];
  sortOrder: number;
  isActive: boolean;
  translations: Record<string, {
    name: string;
    role: string;
    bio?: string;
  }>;
}

export interface AdminService {
  id: string;
  slug: string;
  iconName?: string;
  name: string;
  description: string;
  priceInfo?: string;
}

/// Full admin-edit shape returned by GET /admin/services/{id}.
export interface AdminServiceDetail {
  id: string;
  slug: string;
  iconName?: string;
  sortOrder: number;
  isActive: boolean;
  translations: Record<string, {
    name: string;
    description: string;
    priceInfo?: string;
  }>;
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
    // Auto-poll while any image is still being processed. Caller-side
    // 60-second cap is enforced by useImageProcessingPoll which clears
    // its timer; this is the steady-state cadence while polling is on.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.images?.length) return false;
      return data.images.some(i =>
        i.processingStatus === 'Pending' || i.processingStatus === 'Processing'
      ) ? 5_000 : false;
    },
  });
}

/**
 * Re-enqueue the processing job for an image. Returns Accepted with
 * { id, processingStatus: 'Pending' } so the caller can flip the UI back
 * into spinner-mode.
 */
export function useReprocessPropertyImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      api.post(`/admin/property-images/${imageId}/reprocess`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'property'] }),
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
      // Public listings + per-slug detail caches — public reads use
      // ['properties', ...] and ['property', slug, lang], so prefix-invalidate
      // both so a published edit reflects without a hard refresh.
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property'] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property'] });
    },
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

export function useSetPropertyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/properties/${id}/status`, { status }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] }),
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
      // Public reads use ['blog', page|slug, lang]; prefix invalidation
      // catches list + detail at once.
      qc.invalidateQueries({ queryKey: ['blog'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'blog'] });
      const key = ['admin', 'blog', 1];
      const prev = qc.getQueryData<{ items: AdminBlogPost[]; totalCount: number }>(key);
      if (prev) {
        qc.setQueryData(key, {
          ...prev,
          items: prev.items.filter(p => p.id !== id),
          totalCount: prev.totalCount - 1,
        });
      }
      return { prev, key };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['blog'] });
    },
  });
}

export function useSetBlogPostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Published' | 'Draft' }) =>
      api.patch(`/admin/blog/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['blog'] });
    },
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

/// Detail hook used by the edit-form modal so each language tab can
/// populate from the full translations dict instead of the flat list shape.
export function useAdminTeamMember(id?: string) {
  return useQuery<AdminTeamMemberDetail>({
    queryKey: ['admin', 'team-member', id],
    queryFn: () => api.get(`/admin/team/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/team', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'team'] });
      // Public reads use ['team', lang] and ['team', slug, lang].
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/team/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'team'] });
      qc.invalidateQueries({ queryKey: ['admin', 'team-member', vars.id] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/team/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'team'] });
      const prev = qc.getQueryData<AdminTeamMember[]>(['admin', 'team']);
      qc.setQueryData<AdminTeamMember[]>(['admin', 'team'],
        (old) => old?.filter(m => m.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'team'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'team'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'team'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

// ── Services ───────────────────────────────────────────────────────────────────

export function useAdminServices() {
  return useQuery<AdminService[]>({
    queryKey: ['admin', 'services'],
    queryFn: () => api.get('/admin/services').then(r => r.data),
  });
}

/// Detail hook for the service edit-form — returns the full translations
/// dict so each language tab can pre-populate.
export function useAdminService(id?: string) {
  return useQuery<AdminServiceDetail>({
    queryKey: ['admin', 'service', id],
    queryFn: () => api.get(`/admin/services/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: object) => api.post('/admin/services', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      // Public reads use ['services', lang].
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/services/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      qc.invalidateQueries({ queryKey: ['admin', 'service', vars.id] });
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/services/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'services'] });
      const prev = qc.getQueryData<AdminService[]>(['admin', 'services']);
      qc.setQueryData<AdminService[]>(['admin', 'services'],
        (old) => old?.filter(s => s.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'services'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'careers'] });
      // Public reads use ['careers', lang] for the list and
      // ['career', slug, lang] for detail — invalidate both prefixes.
      qc.invalidateQueries({ queryKey: ['careers'] });
      qc.invalidateQueries({ queryKey: ['career'] });
    },
  });
}

export function useUpdateCareer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) =>
      api.put(`/admin/careers/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'careers'] });
      qc.invalidateQueries({ queryKey: ['careers'] });
      qc.invalidateQueries({ queryKey: ['career'] });
    },
  });
}

export function useDeleteCareer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/careers/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'careers'] });
      const prev = qc.getQueryData<AdminCareer[]>(['admin', 'careers']);
      qc.setQueryData<AdminCareer[]>(['admin', 'careers'],
        (old) => old?.filter(c => c.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'careers'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'careers'] });
      qc.invalidateQueries({ queryKey: ['careers'] });
      qc.invalidateQueries({ queryKey: ['career'] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      // Public reads use ['pageContent', key, lang] — without this the
      // homepage keeps serving the stale copy until a hard refresh.
      qc.invalidateQueries({ queryKey: ['pageContent'] });
    },
  });
}

// ── Contact Messages ───────────────────────────────────────────────────────────
// (Inbound public contact-form submissions. The /admin/contacts route now
// belongs to CRM Contacts — these messages moved to /admin/contact-messages
// in the P2.3 CRM rollout.)

export function useAdminContacts(page = 1) {
  return useQuery<{ items: ContactMessage[]; totalCount: number }>({
    queryKey: ['admin', 'contact-messages', page],
    queryFn: () =>
      api.get('/admin/contact-messages', { params: { page, pageSize: 20 } }).then(r => r.data),
  });
}

export function useUpdateContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/contact-messages/${id}/status`, JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contact-messages'] }),
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
