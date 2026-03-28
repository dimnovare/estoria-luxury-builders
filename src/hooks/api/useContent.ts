import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

export interface PageContent {
  title: string;
  subtitle?: string;
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
  imageUrl: string;
  date: string;
  author: string;
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  email?: string;
  phone?: string;
}

export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Career {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  description?: string;
}

export function usePageContent(pageKey: string) {
  const { i18n } = useTranslation();
  return useQuery<PageContent>({
    queryKey: ['pageContent', pageKey, i18n.language],
    queryFn: () => api.get(`/content/${pageKey}`).then(r => r.data),
  });
}

export function useBlogPosts(page = 1) {
  const { i18n } = useTranslation();
  return useQuery<{ data: BlogPost[]; total: number }>({
    queryKey: ['blog', page, i18n.language],
    queryFn: () => api.get('/blog', { params: { page } }).then(r => r.data),
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
  return useQuery<TeamMember>({
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
