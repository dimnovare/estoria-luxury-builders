import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import type { Property } from './useProperties';
import { DEMO_SERVICES, DEMO_TEAM, DEMO_BLOG } from '@/data/demoData';

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
    queryFn: () => api.get(`/pages/${pageKey}`).then(r => asObject<PageContent>(r.data, {})).catch(() => ({})),
    retry: false,
  });
}

export function useBlogPosts(page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: BlogPost[]; total: number }>({
    queryKey: ['blog', page, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/blog', { params: { page } });
        const items = asArray<BlogPost>(r.data?.items).map(normaliseBlogPost);
        if (items.length > 0) return { data: items, total: r.data?.totalCount ?? 0 };
      } catch { /* fall through */ }
      if (import.meta.env.DEV) {
        return { data: DEMO_BLOG.map(normaliseBlogPost), total: DEMO_BLOG.length };
      }
      return { data: [], total: 0 };
    },
    retry: false,
  });
}

export function useBlogPost(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<BlogPost | undefined>({
    queryKey: ['blog', slug, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get(`/blog/${slug}`);
        return normaliseBlogPost(r.data);
      } catch { /* fall through */ }
      if (import.meta.env.DEV) {
        return DEMO_BLOG.map(normaliseBlogPost).find(p => p.slug === slug);
      }
      return undefined;
    },
    enabled: !!slug,
    retry: false,
  });
}

export function useTeam() {
  const { i18n } = useTranslation();
  return useQuery<TeamMember[]>({
    queryKey: ['team', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/team');
        const items = asArray<TeamMember>(r.data).map(normaliseTeamMember);
        if (items.length > 0) return items;
      } catch { /* fall through */ }
      if (import.meta.env.DEV) {
        return DEMO_TEAM.map(normaliseTeamMember);
      }
      return [];
    },
    retry: false,
  });
}

export function useTeamMember(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<TeamMemberDetail | undefined>({
    queryKey: ['team', slug, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get(`/team/${slug}`);
        return normaliseTeamMemberDetail(r.data);
      } catch { /* fall through */ }
      if (import.meta.env.DEV) {
        return DEMO_TEAM.map(normaliseTeamMemberDetail).find(m => m.slug === slug);
      }
      return undefined;
    },
    enabled: !!slug,
    retry: false,
  });
}

export function useServices() {
  const { i18n } = useTranslation();
  return useQuery<Service[]>({
    queryKey: ['services', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/services');
        const items = asArray<Service>(r.data).map(normaliseService);
        if (items.length > 0) return items;
      } catch { /* fall through */ }
      if (import.meta.env.DEV) {
        return DEMO_SERVICES.map(normaliseService);
      }
      return [];
    },
    retry: false,
  });
}

export function useCareers() {
  const { i18n } = useTranslation();
  return useQuery<Career[]>({
    queryKey: ['careers', i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get('/careers');
        const items = asArray<Career>(r.data).map(normaliseCareer);
        if (items.length > 0) return items;
      } catch { /* fall through */ }
      return [];
    },
    retry: false,
  });
}

export function useCareer(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Career | undefined>({
    queryKey: ['career', slug, i18n.language],
    queryFn: async () => {
      try {
        const r = await api.get(`/careers/${slug}`);
        return normaliseCareer(r.data);
      } catch { /* fall through */ }
      return undefined;
    },
    enabled: !!slug,
    retry: false,
  });
}
