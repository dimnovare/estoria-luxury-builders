import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { PropertyExtraFields } from '@/lib/propertyExportOptions';

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

export interface PropertyExportPortal {
  key: string;
  displayName: string;
  feedUrl: string;
}

export interface PropertyPortalPublicationState {
  isEnabled: boolean;
  validationErrors: string[];
}

/**
 * Optional Kinnisvara24 "extra detail" fields, shared verbatim between the
 * detail DTO returned by GET /admin/properties/{id} and the Create/Update
 * payloads. They mirror the backend AdminPropertyDetailDto / Create+UpdatePropertyDto
 * camelCase JSON contract; `PropertyExtraFields` is the single source of truth.
 */
export type AdminPropertyExtraFields = PropertyExtraFields;

export interface AdminProperty extends AdminPropertyExtraFields {
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
  portalPublications: Record<string, PropertyPortalPublicationState>;
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
  isActive: boolean;
  propertyCount: number;
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

/// Full admin-edit shape returned by GET /admin/careers/{id}. Translations are
/// keyed PascalCase ('Et' | 'En' | 'Ru') so each language tab can pre-populate;
/// only languages that have a row are present.
export interface AdminCareerDetail {
  id: string;
  slug: string;
  isActive: boolean;
  translations: Record<string, {
    title: string;
    description: string;
    location?: string | null;
  }>;
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

type ContactMessagePage = {
  items: ContactMessage[];
  totalCount: number;
};

type ContactMessageSnapshots = Array<
  [QueryKey, ContactMessagePage | ContactMessage[] | undefined]
>;

export interface Subscriber {
  id: string;
  email: string;
  language: string;
  isActive: boolean;
  subscribedAt: string;
}

// ── Properties ─────────────────────────────────────────────────────────────────

export function usePropertyExportPortals() {
  return useQuery({
    queryKey: ['admin', 'property-export-portals'],
    queryFn: () =>
      api.get<PropertyExportPortal[]>('/admin/property-export-portals')
        .then(r => r.data),
    staleTime: 5 * 60_000,
  });
}

/**
 * Per-portal export eligibility for a single property. Tells the editor whether
 * each portal will actually publish this listing, and — when it won't — the
 * concrete data/status reasons (`problems`, English strings) blocking it.
 */
export interface PortalEligibility {
  portalKey: string;
  displayName: string;
  /** The portal publication toggle is on for this property. */
  enabled: boolean;
  /** The property status is Active. */
  active: boolean;
  /** The property data passes this portal's validation. */
  eligible: boolean;
  /** Data issues blocking eligibility (English; map to i18n for display). */
  problems: string[];
}

export function useExportEligibility(propertyId?: string) {
  return useQuery<PortalEligibility[]>({
    queryKey: ['admin', 'exportEligibility', propertyId],
    queryFn: () =>
      api.get(`/admin/properties/${propertyId}/export-eligibility`).then(r => r.data),
    enabled: !!propertyId,
  });
}

// ── AI translation ───────────────────────────────────────────────────────────

export interface TranslateContentRequest {
  from: string;
  to: string[];
  fields: Record<string, string>;
}

/** { "en": { "title": "...", ... }, "ru": { ... } } */
export type TranslateContentResult = Record<string, Record<string, string>>;

/**
 * Translate CMS content fields from one language to others via the backend
 * OpenAI endpoint. Used by the "translate" button on every content form.
 */
export function useTranslateContent() {
  return useMutation({
    mutationFn: (req: TranslateContentRequest) =>
      api.post<TranslateContentResult>('/admin/ai/translate', req).then(r => r.data),
  });
}

/** Draft a listing description from property facts (default Estonian). */
export function useGenerateDescription() {
  return useMutation({
    mutationFn: (req: { facts: Record<string, string>; lang?: string }) =>
      api.post<{ description: string }>('/admin/ai/describe', req).then(r => r.data.description),
  });
}

// ── Cadastral lookup ───────────────────────────────────────────────────────────

/**
 * Result of resolving an Estonian cadastral number (katastritunnus) against the
 * Land Board via GET /admin/properties/cadastral-lookup. `found` is false when the number
 * doesn't resolve; all other fields may be absent in that case.
 */
export interface CadastralLookup {
  found: boolean;
  cadastralNumber?: string;
  fullAddress?: string;
  county?: string;
  municipality?: string;
  settlement?: string;
  countyEhak?: string;
  municipalityEhak?: string;
  settlementEhak?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Look up a property's address, administrative location (EHAK), and map
 * coordinates from its cadastral number. Drives the "Look up" button in the
 * property editor's location section.
 */
export function useCadastralLookup() {
  return useMutation({
    mutationFn: (tunnus: string) =>
      api.get<CadastralLookup>('/admin/properties/cadastral-lookup', { params: { tunnus } }).then(r => r.data),
  });
}

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

/**
 * Wire payload for create/update. The base content/visibility fields are loosely
 * typed (`object` intersection) since PropertyForm builds them dynamically, but
 * the optional Kinnisvara24 extra fields are spelled out via AdminPropertyExtraFields
 * so they round-trip and TypeScript catches contract drift on the form side.
 */
export type CreateUpdatePropertyDto = object & Partial<AdminPropertyExtraFields>;

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUpdatePropertyDto) => api.post('/admin/properties', dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'properties'] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateUpdatePropertyDto }) =>
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

/**
 * Downscale a photo in the browser before upload. A 4000px/3 MB camera shot
 * becomes a ~2560px / ~1 MB JPEG — 3-5× smaller — which is plenty for web while
 * making uploads fast and well under the request limit. Falls back to the
 * original file on any failure or for formats the canvas can't encode (e.g. HEIC).
 */
async function downscaleImage(file: File, maxDim = 2560, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    // Already small enough and not oversized — keep as-is.
    if (scale === 1 && file.size < 1_500_000) { bmp.close?.(); return file; }
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bmp.close?.(); return file; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // no gain — keep original
    const name = file.name.replace(/\.(png|webp|heic|heif|tiff?|bmp|jpeg|jpg)$/i, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Run async tasks with bounded concurrency; never rejects (collects results). */
async function runPool<T, R>(
  items: T[], limit: number, fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try { results[i] = { status: 'fulfilled', value: await fn(items[i], i) }; }
      catch (reason) { results[i] = { status: 'rejected', reason } as PromiseRejectedResult; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const UPLOAD_CONCURRENCY = 3;

export function useUploadPropertyImages() {
  const qc = useQueryClient();
  return useMutation({
    // Each image uploads as its own small request, a few in parallel. This avoids
    // the single 30 MB multipart request (10×3 MB used to 413 / time out) and
    // parallelises the R2 puts. Images are downscaled client-side first.
    mutationFn: async ({ id, files }: { id: string; files: FileList | File[] }) => {
      const arr = Array.from(files);
      if (arr.length === 0) return { uploaded: 0, failed: 0 };

      const prepared = await Promise.all(arr.map(f => downscaleImage(f)));
      const results = await runPool(prepared, UPLOAD_CONCURRENCY, async (file) => {
        const form = new FormData();
        form.append('files', file);
        const r = await api.post(`/admin/properties/${id}/images`, form);
        return r.data;
      });

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length === arr.length) throw (failed[0] as PromiseRejectedResult).reason;
      if (failed.length > 0) {
        toast.error(`${failed.length} of ${arr.length} images failed to upload. The rest were saved — retry the failed ones.`);
      } else {
        toast.success(`${arr.length} image${arr.length > 1 ? 's' : ''} uploaded.`);
      }
      return { uploaded: arr.length - failed.length, failed: failed.length };
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'property', vars.id] }),
    onError: (error: unknown) => {
      const axiosErr = error as {
        response?: { data?: { detail?: string; error?: string } };
      };
      const detail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.error ||
        'Image upload failed. Check the server logs.';
      toast.error(detail);
    },
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

export function useReorderPropertyImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: { id: string; sortOrder: number }[] }) =>
      api.put(`/admin/properties/${id}/images/reorder`, items),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'property', vars.id] }),
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

export function useSetTeamMemberActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive, reassignToAgentId }: { id: string; isActive: boolean; reassignToAgentId?: string }) =>
      api.patch(`/admin/team/${id}/active`, { isActive, reassignToAgentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin','team'] }); qc.invalidateQueries({ queryKey: ['team'] }); },
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

export function useReorderServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch('/admin/services/reorder', items),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: ['admin', 'services'] });
      const prev = qc.getQueryData<AdminService[]>(['admin', 'services']);
      if (prev) {
        const order = new Map(items.map(i => [i.id, i.sortOrder]));
        const next = [...prev].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        );
        qc.setQueryData(['admin', 'services'], next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
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

/// Detail hook for the career edit-form modal — returns the full translations
/// dict so each language tab (et/en/ru) can pre-populate.
export function useAdminCareer(id?: string) {
  return useQuery<AdminCareerDetail>({
    queryKey: ['admin', 'career', id],
    queryFn: () => api.get(`/admin/careers/${id}`).then(r => r.data),
    enabled: !!id,
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
  return useQuery<ContactMessagePage>({
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

export function useDeleteContactMessage() {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof api.delete>>,
    Error,
    string,
    { prev: ContactMessageSnapshots }
  >({
    mutationFn: (id: string) => api.delete(`/admin/contact-messages/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'contact-messages'] });
      // Optimistically remove from every page cache entry
      const prev = qc.getQueriesData<ContactMessagePage | ContactMessage[]>({
        queryKey: ['admin', 'contact-messages'],
      });
      qc.setQueriesData<ContactMessagePage | ContactMessage[]>(
        { queryKey: ['admin', 'contact-messages'] },
        (old) => {
          if (!old || typeof old !== 'object') return old;
          if (Array.isArray(old)) return old.filter((m) => m.id !== id);
          if (Array.isArray(old.items)) {
            return { ...old, items: old.items.filter((m) => m.id !== id) };
          }
          return old;
        },
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'contact-messages'] }),
  });
}

export function useContactMessageUnreadCount() {
  return useQuery<number>({
    queryKey: ['admin', 'contact-messages', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<{ items: { status: string }[]; totalCount: number }>(
        '/admin/contact-messages',
        { params: { page: 1, pageSize: 100 } }
      );
      const items: { status: string }[] = data.items ?? [];
      return items.filter(m => m.status === 'New').length;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
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
