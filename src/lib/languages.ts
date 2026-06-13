// Spoken-language values drifted over time: some rows store ISO codes ("et","en",
// "ru"), some store full English names ("Estonian"), and a few have BOTH. Normalize
// any stored value to one canonical English name + dedupe, so the UI is consistent
// and re-saving a record cleans the stored data.

const ALIAS: Record<string, string> = {
  et: 'Estonian', est: 'Estonian', estonian: 'Estonian', eesti: 'Estonian',
  en: 'English', eng: 'English', english: 'English',
  ru: 'Russian', rus: 'Russian', russian: 'Russian',
  fi: 'Finnish', finnish: 'Finnish',
  de: 'German', german: 'German', deutsch: 'German',
  fr: 'French', french: 'French',
  sv: 'Swedish', swedish: 'Swedish',
};

const LABEL_KEY: Record<string, string> = {
  estonian: 'admin.team.languages.estonian',
  english: 'admin.team.languages.english',
  russian: 'admin.team.languages.russian',
  finnish: 'admin.team.languages.finnish',
  german: 'admin.team.languages.german',
  french: 'admin.team.languages.french',
  swedish: 'admin.team.languages.swedish',
};

/** Canonicalize + dedupe stored spoken-language values. */
export function normalizeLanguages(langs?: string[] | null): string[] {
  if (!langs) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of langs) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) continue;
    const canonical = ALIAS[trimmed.toLowerCase()] ?? trimmed;
    const dedupe = canonical.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(canonical);
  }
  return out;
}

/** Translated label for a canonical language value (falls back to the value). */
export function languageLabel(value: string, t: (key: string, fallback?: string) => string): string {
  const key = LABEL_KEY[value.toLowerCase()];
  return key ? t(key, value) : value;
}
