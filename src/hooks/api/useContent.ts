import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import type { Property } from './useProperties';

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
    queryFn: () => api.get(`/pages/${pageKey}`).then(r => r.data),
  });
}

export function useBlogPosts(page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: BlogPost[]; total: number }>({
    queryKey: ['blog', page, i18n.language],
    queryFn: () =>
      api.get('/blog', { params: { page } }).then(r => ({
        data: r.data.items as BlogPost[],
        total: r.data.totalCount as number,
      })),
  });
}

export function useBlogPost(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<BlogPost>({
    queryKey: ['blog', slug, i18n.language],
    queryFn: () => api.get(`/blog/${slug}`).then(r => r.data),
    enabled: !!slug,
  });
}

export function useTeam() {
  const { i18n } = useTranslation();
  return useQuery<TeamMember[]>({
    queryKey: ['team', i18n.language],
    queryFn: () => api.get('/team').then(r => r.data),
  });
}

export function useTeamMember(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<TeamMemberDetail>({
    queryKey: ['team', slug, i18n.language],
    queryFn: () => api.get(`/team/${slug}`).then(r => r.data),
    enabled: !!slug,
  });
}

export function useServices() {
  const { i18n } = useTranslation();
  return useQuery<Service[]>({
    queryKey: ['services', i18n.language],
    queryFn: () => api.get('/services').then(r => r.data),
  });
}

export function useCareers() {
  const { i18n } = useTranslation();
  return useQuery<Career[]>({
    queryKey: ['careers', i18n.language],
    queryFn: () => api.get('/careers').then(r => r.data),
  });
}

export function useCareer(slug?: string) {
  const { i18n } = useTranslation();
  return useQuery<Career>({
    queryKey: ['career', slug, i18n.language],
    queryFn: () => api.get(`/careers/${slug}`).then(r => r.data),
    enabled: !!slug,
  });
}
