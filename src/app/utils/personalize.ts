/** First name extracted from full name */
export function firstName(name: string | undefined | null): string {
  if (!name) return '';
  return name.split(' ')[0];
}

/**
 * Returns the name to show inside a native-script (non-English) string.
 * Prefers the pre-transliterated native form from the backend; falls back to
 * nothing so no English text bleeds into a Tamil/Hindi/etc. sentence.
 */
export function nativeName(nameNative: string | undefined | null): string {
  return nameNative?.trim() ?? '';
}

/** Append ", [FirstName]" when name is available (English contexts only) */
export function withName(name: string | undefined | null): string {
  const n = firstName(name);
  return n ? `, ${n}` : '';
}

/** Append ", [NativeName]" for non-English strings — omits if not available */
export function withNativeName(nameNative: string | undefined | null): string {
  const n = nativeName(nameNative);
  return n ? `, ${n}` : '';
}

export interface Pronouns {
  subject: string;   // he / she / they
  object: string;    // him / her / them
  possessive: string; // his / her / their
  reflexive: string; // himself / herself / themselves
}

export function pronounsFor(gender: string | undefined | null): Pronouns {
  if (gender === 'male')   return { subject: 'he', object: 'him', possessive: 'his',   reflexive: 'himself'   };
  if (gender === 'female') return { subject: 'she', object: 'her', possessive: 'her',   reflexive: 'herself'   };
  return                          { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' };
}
