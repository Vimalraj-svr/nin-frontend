export type UiLanguage = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn';

/* ── Mood label translations ───────────────────────────── */
const MOOD_TRANSLATIONS: Record<UiLanguage, Record<string, string>> = {
  en: {
    elated: 'Elated', joyful: 'Joyful', playful: 'Playful', loving: 'Loving',
    tender: 'Tender', grateful: 'Grateful', content: 'Content', peaceful: 'Peaceful',
    dreamy: 'Dreamy', pensive: 'Pensive', uncertain: 'Uncertain', heavy: 'Heavy',
    anxious: 'Anxious', numb: 'Numb',
  },
  ta: {
    elated: 'உவகை', joyful: 'மகிழ்ச்சி', playful: 'விளையாட்டு', loving: 'அன்பு',
    tender: 'நெகிழ்ச்சி', grateful: 'நன்றி', content: 'அமைதி', peaceful: 'நிம்மதி',
    dreamy: 'கனவு', pensive: 'சிந்தனை', uncertain: 'தயக்கம்', heavy: 'கனமான',
    anxious: 'பதற்றம்', numb: 'உணர்ச்சியின்மை',
  },
  hi: {
    elated: 'उत्साहित', joyful: 'प्रसन्न', playful: 'चंचल', loving: 'प्रेममय',
    tender: 'कोमल', grateful: 'कृतज्ञ', content: 'संतुष्ट', peaceful: 'शांत',
    dreamy: 'सपनीला', pensive: 'विचारमग्न', uncertain: 'अनिश्चित', heavy: 'भारी',
    anxious: 'चिंतित', numb: 'सुन्न',
  },
  ml: {
    elated: 'ആഹ്ലാദം', joyful: 'സന്തോഷം', playful: 'കളിയൻ', loving: 'സ്നേഹം',
    tender: 'ആർദ്രം', grateful: 'നന്ദി', content: 'സംതൃപ്തി', peaceful: 'ശാന്തി',
    dreamy: 'സ്വപ്നം', pensive: 'ചിന്തനം', uncertain: 'അനിശ്ചിതം', heavy: 'ഭാരം',
    anxious: 'ഉത്കണ്ഠ', numb: 'മരവിപ്പ്',
  },
  te: {
    elated: 'ఉత్సాహం', joyful: 'సంతోషం', playful: 'అల్లరి', loving: 'ప్రేమ',
    tender: 'కోమలత', grateful: 'కృతజ్ఞత', content: 'సంతృప్తి', peaceful: 'శాంతి',
    dreamy: 'కలల', pensive: 'ఆలోచన', uncertain: 'అనిశ్చితం', heavy: 'భారం',
    anxious: 'ఆందోళన', numb: 'చేతనాశూన్యం',
  },
  kn: {
    elated: 'ಉತ್ಸಾಹ', joyful: 'ಸಂತೋಷ', playful: 'ತುಂಟ', loving: 'ಪ್ರೇಮ',
    tender: 'ಕೋಮಲ', grateful: 'ಕೃತಜ್ಞ', content: 'ಸಂತೃಪ್ತಿ', peaceful: 'ಶಾಂತಿ',
    dreamy: 'ಕನಸು', pensive: 'ಚಿಂತನ', uncertain: 'ಅನಿಶ್ಚಿತ', heavy: 'ಭಾರ',
    anxious: 'ಆತಂಕ', numb: 'ಮರಗಟ್ಟು',
  },
};

export function localizedMoodLabel(primary: string, lang?: UiLanguage | null): string {
  const l = lang ?? 'en';
  return MOOD_TRANSLATIONS[l]?.[primary] ?? MOOD_TRANSLATIONS['en'][primary] ?? primary;
}

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
