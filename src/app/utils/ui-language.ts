export type UiLanguage = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn';

const LANGUAGE_ALIASES: Record<string, UiLanguage | 'auto' | 'bilingual'> = {
  auto: 'auto',
  bilingual: 'bilingual',
  en: 'en',
  english: 'en',
  ta: 'ta',
  tamil: 'ta',
  hi: 'hi',
  hindi: 'hi',
  ml: 'ml',
  malayalam: 'ml',
  te: 'te',
  telugu: 'te',
  kn: 'kn',
  kannada: 'kn',
};

const BRAND_SCRIPT: Record<UiLanguage, string> = {
  en: 'Ninaivugal',
  ta: 'நினைவுகள்',
  hi: 'निनैवुगल',
  ml: 'നിനൈവുകൾ',
  te: 'నినైవుగల్',
  kn: 'ನಿನೈವುಗಲ್',
};

export function normalizePreferredLanguage(value?: string | null): string {
  if (!value) return 'auto';
  const key = value.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? 'auto';
}

export function uiLanguageForPreference(value?: string | null): UiLanguage {
  const normalized = normalizePreferredLanguage(value);
  if (normalized === 'auto' || normalized === 'bilingual' || normalized === 'en') return 'en';
  return normalized as UiLanguage;
}

export function localizedBrandMark(value?: string | null): string {
  return BRAND_SCRIPT[uiLanguageForPreference(value)];
}

export function shouldShowLocalizedCompanion(value?: string | null): boolean {
  const normalized = normalizePreferredLanguage(value);
  return normalized !== 'auto' && normalized !== 'bilingual' && normalized !== 'en';
}
