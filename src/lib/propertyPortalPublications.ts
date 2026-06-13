import type {
  PropertyExportPortal,
  PropertyPortalPublicationState,
} from '@/hooks/api/useAdmin';

/**
 * Builds a complete portal-key → boolean map from the registered portals and any
 * saved publication state. Every registered portal is present (defaulting to off)
 * so the admin form always submits a complete map and never leaves stale rows.
 */
export function initializePortalPublications(
  portals: PropertyExportPortal[],
  saved: Record<string, PropertyPortalPublicationState> = {},
): Record<string, boolean> {
  return Object.fromEntries(
    portals.map(portal => [portal.key, saved[portal.key]?.isEnabled ?? false]),
  );
}
