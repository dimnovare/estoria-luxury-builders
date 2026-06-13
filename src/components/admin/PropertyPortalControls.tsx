import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type {
  PropertyExportPortal,
  PropertyPortalPublicationState,
} from '@/hooks/api/useAdmin';

interface PropertyPortalControlsProps {
  portals: PropertyExportPortal[];
  values: Record<string, boolean>;
  states: Record<string, PropertyPortalPublicationState>;
  onChange: (key: string, enabled: boolean) => void;
}

/**
 * Renders one publication switch per registered export portal. Metadata-driven:
 * adding a backend adapter automatically surfaces another switch here, with no
 * hard-coded portal keys. Adapter validation errors are shown beside each portal.
 */
export default function PropertyPortalControls({
  portals,
  values,
  states,
  onChange,
}: PropertyPortalControlsProps) {
  if (portals.length === 0) return null;

  return (
    <div className="space-y-4">
      {portals.map(portal => {
        const errors = states[portal.key]?.validationErrors ?? [];
        return (
          <div key={portal.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`portal-${portal.key}`} className="text-sm font-medium">
                Publish to {portal.displayName}
              </Label>
              <Switch
                id={`portal-${portal.key}`}
                aria-label={`Publish to ${portal.displayName}`}
                checked={values[portal.key] ?? false}
                onCheckedChange={checked => onChange(portal.key, checked)}
              />
            </div>
            {errors.length > 0 && (
              <ul className="space-y-0.5 text-xs text-amber-600">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Only active properties with valid portal data are included in the feed.
      </p>
    </div>
  );
}
