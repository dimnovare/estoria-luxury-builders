import {
  type LucideIcon,
  Home, Key, Calculator, Gavel,
  Building2, Briefcase, TrendingUp, FileCheck,
  Scale, Paintbrush, Landmark, TreePine,
} from 'lucide-react';

/**
 * The seeder stores iconNames lowercase ("home", "key", "calculator", "gavel",
 * etc.) but the Lucide imports are PascalCase. Keying the lookup by lowercase
 * matches what the API actually emits — earlier code keyed PascalCase and
 * fell through to Building2 for every row.
 */
const map: Record<string, LucideIcon> = {
  home:        Home,
  key:         Key,
  calculator:  Calculator,
  gavel:       Gavel,
  building2:   Building2,
  briefcase:   Briefcase,
  trendingup:  TrendingUp,
  filecheck:   FileCheck,
  scale:       Scale,
  paintbrush:  Paintbrush,
  landmark:    Landmark,
  treepine:    TreePine,
};

export function resolveServiceIcon(name?: string): LucideIcon {
  if (!name) return Building2;
  return map[name.toLowerCase()] ?? Building2;
}
