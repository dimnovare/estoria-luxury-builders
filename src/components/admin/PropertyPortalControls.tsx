import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useExportEligibility,
  type PropertyExportPortal,
  type PropertyPortalPublicationState,
  type PortalEligibility,
} from '@/hooks/api/useAdmin';

interface PropertyPortalControlsProps {
  portals: PropertyExportPortal[];
  values: Record<string, boolean>;
  states: Record<string, PropertyPortalPublicationState>;
  onChange: (key: string, enabled: boolean) => void;
  /**
   * Property id used to fetch live export-eligibility. When omitted (e.g. the
   * create form, before the property exists) the per-portal status lines are
   * simply not shown. PropertyForm must pass its route `id` here.
   */
  propertyId?: string;
}

/**
 * Maps a backend export-validation `problem` string (English) to a friendly,
 * translated line. Unknown messages fall back to the raw string so the owner
 * still sees *something* actionable rather than nothing.
 */
function mapProblem(problem: string, t: TFunction): string {
  // Location messages are parameterised on the backend ("…set the city to X"),
  // so match by prefix rather than exact text.
  if (problem.startsWith('Location not supported')) {
    return t(
      'admin.export.problem.location',
      'Set the city to Tallinn — the portal currently accepts only Tallinn.',
    );
  }
  const lookup: Record<string, string> = {
    'A positive price is required.': t(
      'admin.export.problem.price',
      'Add a price greater than 0.',
    ),
    'A positive area is required.': t(
      'admin.export.problem.size',
      'Add the area (m²).',
    ),
    'The assigned agent needs a valid email address.': t(
      'admin.export.problem.agentEmail',
      'Assign an agent who has a valid email address.',
    ),
    'At least one title is required.': t(
      'admin.export.problem.title',
      'Add a title in at least one language.',
    ),
    'At least one description is required.': t(
      'admin.export.problem.description',
      'Add a description in at least one language.',
    ),
    'Property type is not supported by Kinnisvara24.': t(
      'admin.export.problem.propertyType',
      'This property type is not accepted by the portal.',
    ),
    'Transaction type is not supported by Kinnisvara24.': t(
      'admin.export.problem.transactionType',
      'This transaction type is not accepted by the portal.',
    ),
  };
  return lookup[problem] ?? problem;
}

/**
 * Renders one publication switch per registered export portal. Metadata-driven:
 * adding a backend adapter automatically surfaces another switch here, with no
 * hard-coded portal keys. Adapter validation errors are shown beside each portal.
 *
 * Under each toggle we surface live export-eligibility so the owner knows
 * whether the listing will *actually* appear on the portal — and, if not, the
 * exact data/status fixes required.
 */
export default function PropertyPortalControls({
  portals,
  values,
  states,
  onChange,
  propertyId,
}: PropertyPortalControlsProps) {
  const { t } = useTranslation();
  const { data: eligibility } = useExportEligibility(propertyId);
  if (portals.length === 0) return null;

  const eligibilityByKey = (eligibility ?? []).reduce<Record<string, PortalEligibility>>(
    (acc, e) => {
      acc[e.portalKey] = e;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {portals.map(portal => {
        const errors = states[portal.key]?.validationErrors ?? [];
        const label = t('admin.properties.portal.publishTo', { name: portal.displayName });
        const isOn = values[portal.key] ?? false;
        const status = eligibilityByKey[portal.key];
        const willAppear = !!status && status.active && status.eligible;
        return (
          <div key={portal.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <Label
                htmlFor={`portal-${portal.key}`}
                className="text-sm font-medium text-foreground"
              >
                {label}
              </Label>
              <Switch
                id={`portal-${portal.key}`}
                aria-label={label}
                checked={isOn}
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
            {isOn && status && willAppear && (
              <p className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {t('admin.export.willAppear', 'This listing will appear on {{portal}}.', {
                    portal: status.displayName,
                  })}
                </span>
              </p>
            )}
            {isOn && status && !willAppear && (
              <div className="rounded-md border border-border bg-muted p-2.5 text-xs text-foreground">
                <p className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle
                    className="h-3.5 w-3.5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <span>
                    {t(
                      'admin.export.wontAppear',
                      'This listing will NOT appear on {{portal}} until:',
                      { portal: status.displayName },
                    )}
                  </span>
                </p>
                <ul className="mt-1.5 ml-5 list-disc space-y-0.5 text-muted-foreground">
                  {!status.active && (
                    <li>{t('admin.export.needActive', 'Set the property status to Active.')}</li>
                  )}
                  {status.problems.map((problem, i) => (
                    <li key={i}>{mapProblem(problem, t)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {t('admin.properties.portal.feedHelp')}
      </p>
    </div>
  );
}
