import type { TFunction } from 'i18next';

/**
 * Translates an enum value coming from the API (PascalCase) into a localized
 * label. Falls back to the raw value if the key is missing.
 *
 * The frontend also serializes some of these enums lowercase in URL params and
 * filter state — pass the raw shape and the helper will normalize it.
 */
const norm = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const propertyTypeLabel = (value: string | null | undefined, t: TFunction): string => {
  const v = norm(value);
  if (!v) return '';
  return t(`enums.propertyType.${v}`, { defaultValue: v });
};

export const transactionTypeLabel = (value: string | null | undefined, t: TFunction): string => {
  const v = norm(value);
  if (!v) return '';
  return t(`enums.transactionType.${v}`, { defaultValue: v });
};

export const propertyStatusLabel = (value: string | null | undefined, t: TFunction): string => {
  const v = norm(value);
  if (!v) return '';
  return t(`enums.propertyStatus.${v}`, { defaultValue: v });
};

/**
 * Closure reasons are multi-word PascalCase (AgentWithdrew), which `norm` would
 * flatten to "Agentwithdrew" and miss the i18n key — so match the canonical key
 * case-insensitively instead.
 */
const CLOSURE_REASON_KEYS = ['ClientWithdrew', 'AgentWithdrew', 'ContractEnded', 'Other'] as const;

export const propertyClosureReasonLabel = (value: string | null | undefined, t: TFunction): string => {
  if (!value) return '';
  const key = CLOSURE_REASON_KEYS.find(k => k.toLowerCase() === value.toLowerCase()) ?? value;
  return t(`enums.propertyClosureReason.${key}`, { defaultValue: key });
};

export const contactStatusLabel = (value: string | null | undefined, t: TFunction): string => {
  const v = norm(value);
  if (!v) return '';
  return t(`enums.contactStatus.${v}`, { defaultValue: v });
};

export const blogStatusLabel = (value: string | null | undefined, t: TFunction): string => {
  const v = norm(value);
  if (!v) return '';
  return t(`enums.blogStatus.${v}`, { defaultValue: v });
};
