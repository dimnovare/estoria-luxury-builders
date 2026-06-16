import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { handleCrmError } from '@/hooks/api/useCrm';

/**
 * Relationship / Companies / PropertyDocuments API layer.
 *
 * Mirrors the conventions in useCrm.ts: axios `api` (JWT bearer + lang),
 * react-query useQuery/useMutation, namespaced query keys, toast + handleCrmError
 * on mutate. All enums are sent/received as their STRING names (backend binds
 * the C# enum from the name), so the TS types below are string-literal unions.
 *
 * Endpoints (admin, /api prefix supplied by the axios baseURL):
 *   /admin/companies                     — company CRUD
 *   /admin/relationships/*               — link/unlink contacts, companies, properties
 *   /admin/property-documents/*          — upload / list / download / delete docs
 */

// ── Enums (string names, matching the backend) ───────────────────────────────

export type ContactCompanyRole =
  | 'Owner' | 'BoardMember' | 'Employee' | 'Representative' | 'Accountant' | 'Other';

export const CONTACT_COMPANY_ROLES: ContactCompanyRole[] = [
  'Owner', 'BoardMember', 'Employee', 'Representative', 'Accountant', 'Other',
];

export type PropertyContactRole =
  | 'Owner' | 'CoOwner' | 'Seller' | 'Buyer' | 'Tenant'
  | 'Landlord' | 'Representative' | 'InterestedParty' | 'Other';

export const PROPERTY_CONTACT_ROLES: PropertyContactRole[] = [
  'Owner', 'CoOwner', 'Seller', 'Buyer', 'Tenant',
  'Landlord', 'Representative', 'InterestedParty', 'Other',
];

export type PropertyCompanyRole =
  | 'OwnerCompany' | 'SellerCompany' | 'BuyerCompany'
  | 'ManagementCompany' | 'Developer' | 'Agency' | 'Other';

export const PROPERTY_COMPANY_ROLES: PropertyCompanyRole[] = [
  'OwnerCompany', 'SellerCompany', 'BuyerCompany',
  'ManagementCompany', 'Developer', 'Agency', 'Other',
];

export type DocumentCategory =
  | 'Contract' | 'Ownership' | 'Survey' | 'Floorplan' | 'EnergyCertificate'
  | 'Identity' | 'Financial' | 'Correspondence' | 'Other';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Contract', 'Ownership', 'Survey', 'Floorplan', 'EnergyCertificate',
  'Identity', 'Financial', 'Correspondence', 'Other',
];

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CompanyWriteDto {
  name: string;
  registryCode?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  assignedAgentId?: string;
}

export interface CompanyListDto {
  id: string;
  name: string;
  registryCode?: string;
  email?: string;
  phone?: string;
  peopleCount: number;
  propertyCount: number;
  createdAt: string;
}

export interface CompanyPersonDto {
  linkId: string;
  contactId: string;
  fullName: string;
  role: ContactCompanyRole;
  title?: string;
  ownershipPercent?: number;
  isPrimary: boolean;
  email?: string;
  phone?: string;
}

export interface CompanyPropertyDto {
  linkId: string;
  propertyId: string;
  title: string;
  role: PropertyCompanyRole;
  city?: string;
  status: string;
}

export interface DocumentDto {
  id: string;
  propertyId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  category: DocumentCategory;
  notes?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  title: string;
  stage: string;
  dealType: string;
  side: string;
  listingPrice?: number;
  soldPrice?: number;
  currency: string;
  propertyId?: string;
  createdAt: string;
}

export interface CompanyDetailDto extends CompanyWriteDto {
  id: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
  people: CompanyPersonDto[];
  properties: CompanyPropertyDto[];
  documents: DocumentDto[];
  transactions: TransactionDto[];
}

export interface PropertyContactLinkDto {
  linkId: string;
  contactId: string;
  fullName: string;
  role: PropertyContactRole;
  note?: string;
  email?: string;
  phone?: string;
}

export interface PropertyCompanyLinkDto {
  linkId: string;
  companyId: string;
  name: string;
  role: PropertyCompanyRole;
  note?: string;
}

export interface ContactCompanyLinkDto {
  linkId: string;
  companyId: string;
  companyName: string;
  role: ContactCompanyRole;
  title?: string;
  ownershipPercent?: number;
  isPrimary: boolean;
}

export interface ContactPropertyLinkDto {
  linkId: string;
  propertyId: string;
  title: string;
  role: PropertyContactRole;
  city?: string;
  status: string;
}

/** Aggregate returned by GET /admin/relationships/property/{id}. */
export interface PropertyConnections {
  contacts: PropertyContactLinkDto[];
  companies: PropertyCompanyLinkDto[];
  transactions: TransactionDto[];
}

/** Aggregate returned by GET /admin/relationships/contact/{id}. */
export interface ContactConnections {
  companies: ContactCompanyLinkDto[];
  properties: ContactPropertyLinkDto[];
  transactions: TransactionDto[];
}

// ── Filter / param types ─────────────────────────────────────────────────────

export interface CompanyListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CompanyListResult {
  items: CompanyListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const relationshipKeys = {
  companies: (params?: CompanyListParams) =>
    ['relationships', 'companies', params ?? {}] as const,
  company: (id?: string) => ['relationships', 'company', id] as const,
  property: (propertyId?: string) => ['relationships', 'property', propertyId] as const,
  contact: (contactId?: string) => ['relationships', 'contact', contactId] as const,
  documents: (propertyId?: string) => ['relationships', 'documents', propertyId] as const,
  graph: (type?: string, id?: string) => ['relationships', 'graph', type, id] as const,
};

// ── Connections graph ────────────────────────────────────────────────────────

export type GraphEntityType = 'property' | 'contact' | 'company';

export interface GraphNode {
  id: string;
  type: 'person' | 'company' | 'property' | 'deal';
  label: string;
  isCenter: boolean;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  role?: string | null;
  kind: string;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Neighbourhood graph (centre + 1-hop neighbours + links among them) for the map. */
export function useConnectionsGraph(type: GraphEntityType, id?: string) {
  return useQuery<RelationshipGraph>({
    queryKey: relationshipKeys.graph(type, id),
    queryFn: () => api.get(`/admin/relationships/graph/${type}/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// ── Companies ────────────────────────────────────────────────────────────────

export function useCompanies(params: CompanyListParams = {}) {
  return useQuery<CompanyListResult>({
    queryKey: relationshipKeys.companies(params),
    queryFn: () =>
      api.get('/admin/companies', { params: { ...params } }).then((r) => r.data),
  });
}

export function useCompany(id?: string) {
  return useQuery<CompanyDetailDto>({
    queryKey: relationshipKeys.company(id),
    queryFn: () => api.get(`/admin/companies/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CompanyWriteDto) =>
      api.post('/admin/companies', dto).then((r) => r.data as { id: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relationships', 'companies'] });
      toast.success(i18n.t('admin.companies.toast.created'));
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.companies.toast.saveFailed')),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CompanyWriteDto }) =>
      api.put(`/admin/companies/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['relationships', 'companies'] });
      qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.id) });
      toast.success(i18n.t('admin.companies.toast.updated'));
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.companies.toast.saveFailed')),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/companies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relationships', 'companies'] });
      toast.success(i18n.t('admin.companies.toast.deleted'));
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.companies.toast.deleteFailed')),
  });
}

// ── Connections (read) ───────────────────────────────────────────────────────

export function usePropertyConnections(propertyId?: string) {
  return useQuery<PropertyConnections>({
    queryKey: relationshipKeys.property(propertyId),
    queryFn: () =>
      api.get(`/admin/relationships/property/${propertyId}`).then((r) => r.data),
    enabled: !!propertyId,
  });
}

export function useContactConnections(contactId?: string) {
  return useQuery<ContactConnections>({
    queryKey: relationshipKeys.contact(contactId),
    queryFn: () =>
      api.get(`/admin/relationships/contact/${contactId}`).then((r) => r.data),
    enabled: !!contactId,
  });
}

// ── Link (create) mutations ──────────────────────────────────────────────────

export interface AddContactCompanyDto {
  contactId: string;
  companyId: string;
  role: ContactCompanyRole;
  title?: string;
  ownershipPercent?: number;
  isPrimary: boolean;
}

export function useAddContactCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddContactCompanyDto) =>
      api.post('/admin/relationships/contact-company', dto).then((r) => r.data as { id: string }),
    onSuccess: (_d, vars) => {
      // Both sides of the link can be on screen — refresh contact + company views.
      qc.invalidateQueries({ queryKey: relationshipKeys.contact(vars.contactId) });
      qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.companyId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'companies'] });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.crm.toast.saveFailed')),
  });
}

export interface AddPropertyContactDto {
  propertyId: string;
  contactId: string;
  role: PropertyContactRole;
  note?: string;
}

export function useAddPropertyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddPropertyContactDto) =>
      api.post('/admin/relationships/property-contact', dto).then((r) => r.data as { id: string }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      qc.invalidateQueries({ queryKey: relationshipKeys.contact(vars.contactId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.crm.toast.saveFailed')),
  });
}

export interface AddPropertyCompanyDto {
  propertyId: string;
  companyId: string;
  role: PropertyCompanyRole;
  note?: string;
}

export function useAddPropertyCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddPropertyCompanyDto) =>
      api.post('/admin/relationships/property-company', dto).then((r) => r.data as { id: string }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.companyId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.crm.toast.saveFailed')),
  });
}

// ── Unlink (delete) mutations ────────────────────────────────────────────────
// The link id alone is enough to delete server-side. Callers pass the related
// entity ids (contactId/companyId/propertyId) so we can fan-out invalidation;
// they're optional so the hook stays usable from either side of a link.

export function useRemoveContactCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; contactId?: string; companyId?: string }) =>
      api.delete(`/admin/relationships/contact-company/${id}`),
    onSuccess: (_d, vars) => {
      if (vars.contactId) qc.invalidateQueries({ queryKey: relationshipKeys.contact(vars.contactId) });
      if (vars.companyId) qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.companyId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'companies'] });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.relations.confirmRemove')),
  });
}

export function useRemovePropertyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; propertyId?: string; contactId?: string }) =>
      api.delete(`/admin/relationships/property-contact/${id}`),
    onSuccess: (_d, vars) => {
      if (vars.propertyId) qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      if (vars.contactId) qc.invalidateQueries({ queryKey: relationshipKeys.contact(vars.contactId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.relations.confirmRemove')),
  });
}

export function useRemovePropertyCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; propertyId?: string; companyId?: string }) =>
      api.delete(`/admin/relationships/property-company/${id}`),
    onSuccess: (_d, vars) => {
      if (vars.propertyId) qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      if (vars.companyId) qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.companyId) });
      qc.invalidateQueries({ queryKey: ['relationships', 'graph'] });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.relations.confirmRemove')),
  });
}

// ── Property documents ───────────────────────────────────────────────────────

export function usePropertyDocuments(propertyId?: string) {
  return useQuery<DocumentDto[]>({
    queryKey: relationshipKeys.documents(propertyId),
    queryFn: () =>
      api.get(`/admin/property-documents/property/${propertyId}`).then((r) => r.data),
    enabled: !!propertyId,
  });
}

export interface UploadDocumentVars {
  propertyId: string;
  file: File;
  category: DocumentCategory;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  notes?: string;
}

export function useUploadPropertyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, file, category, contactId, companyId, dealId, notes }: UploadDocumentVars) => {
      // Multipart body holds the binary under field 'file'; the rest are query
      // params per the API contract.
      const form = new FormData();
      form.append('file', file);
      return api
        .post(`/admin/property-documents/${propertyId}/upload`, form, {
          params: { category, contactId, companyId, dealId, notes },
        })
        .then((r) => r.data as DocumentDto);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: relationshipKeys.documents(vars.propertyId) });
      // A document attached to a contact/company surfaces on those detail views too.
      qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      if (vars.contactId) qc.invalidateQueries({ queryKey: relationshipKeys.contact(vars.contactId) });
      if (vars.companyId) qc.invalidateQueries({ queryKey: relationshipKeys.company(vars.companyId) });
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.crm.toast.saveFailed')),
  });
}

/**
 * Downloads a property document. The backend hands back a short-lived presigned
 * URL ({ url, fileName, expiresAt }); we follow it from a temporary anchor so
 * the browser performs the actual file download (respecting the file name).
 */
export function useDownloadPropertyDocument() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data } = await api.get<{ url: string; fileName: string; expiresAt: string }>(
        `/admin/property-documents/${id}/download-url`,
      );
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.fileName || '';
      // Presigned URLs may be cross-origin; rel=noopener for safety.
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return data;
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.documents.download')),
  });
}

export function useDeletePropertyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; propertyId?: string }) =>
      api.delete(`/admin/property-documents/${id}`),
    onSuccess: (_d, vars) => {
      if (vars.propertyId) {
        qc.invalidateQueries({ queryKey: relationshipKeys.documents(vars.propertyId) });
        qc.invalidateQueries({ queryKey: relationshipKeys.property(vars.propertyId) });
      } else {
        qc.invalidateQueries({ queryKey: ['relationships', 'documents'] });
      }
    },
    onError: (err) => handleCrmError(err, i18n.t('admin.documents.delete')),
  });
}
