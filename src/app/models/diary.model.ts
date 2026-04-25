export type OutputMode = 'SAME_LANGUAGE' | 'ENGLISH_REFINED' | 'BILINGUAL';

export type LanguageCode = 'auto' | 'ta' | 'hi' | 'te' | 'kn' | 'ml' | 'en' | 'bilingual' | string;

export interface GenerateRequest {
  transcript: string;
  output_mode: OutputMode;
  language_override: string;
  entry_date?: string;  // ISO "YYYY-MM-DD"; omit for today
}

export type EmotionFlag =
  | 'love' | 'happy' | 'sad' | 'anxious' | 'grateful'
  | 'angry' | 'nostalgic' | 'hopeful' | 'confused' | 'peaceful';

export interface ImageAsset {
  public_id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface EntryComment {
  id: string;
  text: string;
  created_at: string;
}

export interface DiaryEntry {
  id: string;
  transcript: string;
  detected_language: string | null;
  preferred_language: string;
  output_mode: string;
  title_original: string | null;
  content_original: string | null;
  title_english: string | null;
  content_english: string | null;
  mood_summary: string | null;
  created_at: string;
  content_edit: string | null;
  title_edit: string | null;
  emojis: string[];
  images: ImageAsset[];
  comments: EntryComment[];
  is_hidden: boolean;
  emotion_flag: EmotionFlag | null;
}

export const EMOTION_FLAGS: { value: EmotionFlag; label: string; emoji: string; color: string }[] = [
  { value: 'love',      label: 'Love',      emoji: '❤️',  color: '#e63946' },
  { value: 'happy',     label: 'Happy',     emoji: '😊',  color: '#f4a261' },
  { value: 'sad',       label: 'Sad',       emoji: '😢',  color: '#457b9d' },
  { value: 'anxious',   label: 'Anxious',   emoji: '😰',  color: '#9b5de5' },
  { value: 'grateful',  label: 'Grateful',  emoji: '🙏',  color: '#2d6a4f' },
  { value: 'angry',     label: 'Angry',     emoji: '😤',  color: '#d62828' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🌅',  color: '#e9c46a' },
  { value: 'hopeful',   label: 'Hopeful',   emoji: '🌱',  color: '#52b788' },
  { value: 'confused',  label: 'Confused',  emoji: '🤔',  color: '#8d99ae' },
  { value: 'peaceful',  label: 'Peaceful',  emoji: '🕊️', color: '#90e0ef' },
];

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface OutputModeOption {
  value: OutputMode;
  label: string;
  description: string;
  icon: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'auto',  label: 'Auto-Detect', nativeLabel: 'Auto',        flag: '🔍' },
  { code: 'ta',    label: 'Tamil',       nativeLabel: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'hi',    label: 'Hindi',       nativeLabel: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'te',    label: 'Telugu',      nativeLabel: 'తెలుగు',      flag: '🇮🇳' },
  { code: 'kn',    label: 'Kannada',     nativeLabel: 'ಕನ್ನಡ',      flag: '🇮🇳' },
  { code: 'ml',    label: 'Malayalam',   nativeLabel: 'മലയാളം',      flag: '🇮🇳' },
  { code: 'en',    label: 'English',     nativeLabel: 'English',      flag: '🇬🇧' },
];

export const OUTPUT_MODE_OPTIONS: OutputModeOption[] = [
  {
    value: 'SAME_LANGUAGE',
    label: 'Same Language',
    description: 'Write diary in the original language',
    icon: '🌐',
  },
  {
    value: 'ENGLISH_REFINED',
    label: 'English',
    description: 'Refined English narrative',
    icon: '✨',
  },
  {
    value: 'BILINGUAL',
    label: 'Bilingual',
    description: 'Both languages side by side',
    icon: '🔀',
  },
];

export const LANGUAGE_DISPLAY: Record<string, { label: string; class: string }> = {
  ta: { label: 'Tamil',     class: 'lang-badge--ta' },
  hi: { label: 'Hindi',     class: 'lang-badge--hi' },
  te: { label: 'Telugu',    class: 'lang-badge--te' },
  kn: { label: 'Kannada',   class: 'lang-badge--kn' },
  ml: { label: 'Malayalam', class: 'lang-badge--ml' },
  en: { label: 'English',   class: 'lang-badge--en' },
};
