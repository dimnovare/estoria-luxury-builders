// Stub — admin pages still reference this file pending full admin API wiring.
import type { TeamMember, Service, Career } from '@/hooks/api/useContent';

export type { TeamMember };

export interface ServiceItem extends Service {}
export type { Career as CareerItem };

export const mockTeam: TeamMember[] = [];
export const mockServices: ServiceItem[] = [];
export const mockCareers: Career[] = [];
