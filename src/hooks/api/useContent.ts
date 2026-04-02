import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import type { Property } from './useProperties';

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

const normaliseTeamMember = (member: unknown): TeamMember => {
  const safe = asObject<Partial<TeamMember>>(member, {});

  return {
    id: safe.id ?? '',
    slug: safe.slug ?? '',
    name: safe.name ?? '',
    role: safe.role ?? '',
    photoUrl: safe.photoUrl,
    phone: safe.phone,
    email: safe.email,
    languages: asArray<string>(safe.languages),
  };
};

const normaliseTeamMemberDetail = (member: unknown): TeamMemberDetail => {
  const safe = asObject<Partial<TeamMemberDetail>>(member, {});

  return {
    ...normaliseTeamMember(safe),
    bio: safe.bio,
    properties: asArray<Property>(safe.properties),
  };
};

const normaliseService = (service: unknown): Service => {
  const safe = asObject<Partial<Service>>(service, {});

  return {
    id: safe.id ?? '',
    slug: safe.slug,
    iconName: safe.iconName,
    name: safe.name ?? '',
    description: safe.description,
    priceInfo: safe.priceInfo,
  };
};

const normaliseCareer = (career: unknown): Career => {
  const safe = asObject<Partial<Career>>(career, {});

  return {
    id: safe.id ?? '',
    slug: safe.slug ?? '',
    title: safe.title ?? '',
    location: safe.location,
    description: safe.description,
    isActive: safe.isActive,
  };
};

const normaliseBlogPost = (post: unknown): BlogPost => {
  const safe = asObject<Partial<BlogPost>>(post, {});
  const author = safe.author ? asObject<NonNullable<BlogPost['author']>>(safe.author, { name: '' }) : undefined;

  return {
    id: safe.id ?? '',
    slug: safe.slug ?? '',
    title: safe.title ?? '',
    excerpt: safe.excerpt ?? '',
    content: safe.content,
    coverImageUrl: safe.coverImageUrl,
    publishedAt: safe.publishedAt,
    authorName: safe.authorName,
    authorPhotoUrl: safe.authorPhotoUrl,
    category: safe.category,
    author,
  };
};

export interface PageContent {
  id?: string;
  pageKey?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  category?: string;
  /** Only present on detail responses (BlogPostDetailDto.Author). */
  author?: {
    id?: string;
    slug?: string;
    name: string;
    role?: string;
    photoUrl?: string;
    bio?: string;
  };
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  languages?: string[];
}

export interface TeamMemberDetail extends TeamMember {
  bio?: string;
  properties?: Property[];
}

export interface Service {
  id: string;
  slug?: string;
  iconName?: string;
  name: string;
  description?: string;
  priceInfo?: string;
}

export interface Career {
  id: string;
  slug: string;
  title: string;
  location?: string;
  description?: string;
  isActive?: boolean;
}

export function usePageContent(pageKey: string) {
  const { i18n } = useTranslation();
  return useQuery<PageContent>({
    queryKey: ['pageContent', pageKey, i18n.language],
    queryFn: () => api.get(`/pages/${pageKey}`).then(r => asObject<PageContent>(r.data, {})),
  });
}

export function useBlogPosts(page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: BlogPost[]; total: number }>({
    queryKey: ['blog', page, i18n.language],
    queryFn: () =>
      api.get('/blog', { params: { page } }).then(r => ({
        data: asArray<BlogPost>(r.data?.items).map(normaliseBlogPost),
        total: (r.data?.totalCount as number) ?? 0,
      })),
  });
}

export function useBlogPost(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<BlogPost>({
    queryKey: ['blog', slug, i18n.language],
    queryFn: () => api.get(`/blog/${slug}`).then(r => normaliseBlogPost(r.data)),
    enabled: !!slug,
  });
}

export function useTeam() {
  const { i18n } = useTranslation();
  return useQuery<TeamMember[]>({
    queryKey: ['team', i18n.language],
    queryFn: () => api.get('/team').then(r => asArray<TeamMember>(r.data).map(normaliseTeamMember)),
  });
}

export function useTeamMember(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<TeamMemberDetail>({
    queryKey: ['team', slug, i18n.language],
    queryFn: () => api.get(`/team/${slug}`).then(r => normaliseTeamMemberDetail(r.data)),
    enabled: !!slug,
  });
}

export function useServices() {
  const { i18n } = useTranslation();
  return useQuery<Service[]>({
    queryKey: ['services', i18n.language],
    queryFn: () => api.get('/services').then(r => asArray<Service>(r.data).map(normaliseService)),
  });
}

export function useCareers() {
  const { i18n } = useTranslation();
  return useQuery<Career[]>({
    queryKey: ['careers', i18n.language],
    queryFn: () => api.get('/careers').then(r => asArray<Career>(r.data).map(normaliseCareer)),
  });
}

export function useCareer(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Career>({
    queryKey: ['career', slug, i18n.language],
    queryFn: () => api.get(`/careers/${slug}`).then(r => normaliseCareer(r.data)),
    enabled: !!slug,
  });
}
