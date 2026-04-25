import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DiaryEntry, EmotionFlag, EntryComment, GenerateRequest, ImageAsset } from '../models/diary.model';
import { environment } from '../../environments/environment';

export interface MoodInfo { hue: number; warmth: number; label: string; primary: string; }

const MOOD_MAP: Record<string, MoodInfo> = {
  joyful:    { hue: 18,  warmth: 0.88, label: 'Joyful · மகிழ்ச்சி',    primary: 'joyful'    },
  tender:    { hue: 42,  warmth: 0.72, label: 'Tender · நெகிழ்ச்சி',    primary: 'tender'    },
  content:   { hue: 56,  warmth: 0.78, label: 'Content · அமைதி',         primary: 'content'   },
  uncertain: { hue: 228, warmth: 0.38, label: 'Uncertain · தயக்கம்',     primary: 'uncertain' },
  heavy:     { hue: 260, warmth: 0.28, label: 'Heavy · கனமான',           primary: 'heavy'     },
  anxious:   { hue: 284, warmth: 0.34, label: 'Anxious · பதற்றம்',       primary: 'anxious'   },
};

export interface SampleEntry {
  id: string;
  date: string;
  dayLabel: string;
  timeLabel: string;
  title: string;
  raw: string;
  mood: MoodInfo;
  language: string;
  style: string;
  preview: string;
  wordCount: number;
  echoIds: string[];
}

export const SAMPLE_ENTRIES: SampleEntry[] = [
  {
    id: 'e7', date: '2026-04-18', dayLabel: 'Saturday', timeLabel: '11:47 pm',
    title: 'The jasmine on amma\'s window',
    raw: 'Veetuku ponen today. Amma had kept malligai poo near the window. That smell — suddenly I was ten years old again, waiting for her to finish kolam so we could eat.',
    mood: MOOD_MAP['tender'], language: 'Tanglish → English', style: 'Bilingual',
    preview: 'The jasmine on amma\'s windowsill — and suddenly I was ten years old again, waiting for kolam to dry.',
    wordCount: 184, echoIds: ['e3', 'e5'],
  },
  {
    id: 'e6', date: '2026-04-17', dayLabel: 'Friday', timeLabel: '10:12 pm',
    title: 'Quiet rain, louder thoughts',
    raw: 'Rained all evening. Didn\'t go out. Kept thinking about the Bangalore offer. Pros and cons list-ah mattum podu podu nu pannen but feelings column empty-a iruku.',
    mood: MOOD_MAP['uncertain'], language: 'Tanglish', style: 'English Refined',
    preview: 'Rain all evening. A pros-and-cons list that refused to grow a feelings column.',
    wordCount: 221, echoIds: ['e2'],
  },
  {
    id: 'e5', date: '2026-04-15', dayLabel: 'Wednesday', timeLabel: '9:02 pm',
    title: 'Meera laughed at my tea',
    raw: 'Meera came over for chai. I made it too sweet again. She laughed and said I\'m still the same person from hostel. Feels good to be known.',
    mood: MOOD_MAP['joyful'], language: 'English', style: 'Same Language',
    preview: 'Meera came for chai. Too sweet, again. She laughed — and I felt, for a moment, completely known.',
    wordCount: 142, echoIds: [],
  },
  {
    id: 'e4', date: '2026-04-13', dayLabel: 'Monday', timeLabel: '11:55 pm',
    title: 'The meeting I dreaded',
    raw: 'Inniki romba tough day. Office meeting was so stressful. Boss kept interrupting. I wanted to speak but words got stuck. Came home and just sat in the dark for ten minutes.',
    mood: MOOD_MAP['heavy'], language: 'Tanglish', style: 'English Refined',
    preview: 'A meeting that pressed me flat. Ten minutes of dark, and then the slow return to myself.',
    wordCount: 198, echoIds: ['e1'],
  },
  {
    id: 'e3', date: '2026-04-11', dayLabel: 'Saturday', timeLabel: '8:30 am',
    title: 'Morning filter coffee',
    raw: 'Amma\'s filter coffee. Steel tumbler. That first sip before anyone else wakes up. Small, small happinesses.',
    mood: MOOD_MAP['content'], language: 'English', style: 'Same Language',
    preview: 'Steel tumbler, first sip, no one else awake yet. A small, whole happiness.',
    wordCount: 96, echoIds: ['e7'],
  },
  {
    id: 'e2', date: '2026-04-09', dayLabel: 'Thursday', timeLabel: '10:44 pm',
    title: 'The Bangalore offer',
    raw: 'Got the offer today. Bangalore. More money. Further from amma. Head says yes. Something inside is quieter about it.',
    mood: MOOD_MAP['uncertain'], language: 'English', style: 'Same Language',
    preview: 'The offer arrived. Head: yes. The quieter part of me: asking to be heard.',
    wordCount: 167, echoIds: ['e6'],
  },
  {
    id: 'e1', date: '2026-04-07', dayLabel: 'Tuesday', timeLabel: '11:18 pm',
    title: 'First day at the new desk',
    raw: 'First day at the new team. Didn\'t know where to sit. Everyone seemed to already know each other. Pretended to be on a call for fifteen minutes.',
    mood: MOOD_MAP['anxious'], language: 'English', style: 'Same Language',
    preview: 'Pretended to be on a call for fifteen minutes. New team, old feeling.',
    wordCount: 154, echoIds: ['e4'],
  },
];

export const CALENDAR_DATA: Record<number, { hue: number; warmth: number }> = (() => {
  const data: Record<number, { hue: number; warmth: number }> = {};
  SAMPLE_ENTRIES.forEach(e => {
    const day = parseInt(e.date.split('-')[2], 10);
    data[day] = { hue: e.mood.hue, warmth: e.mood.warmth };
  });
  [[1,42,0.7],[2,56,0.75],[3,18,0.82],[5,228,0.4],[6,42,0.7],[8,56,0.76],[10,18,0.84],[12,260,0.35],[14,42,0.72],[16,56,0.78]]
    .forEach(([d,h,w]) => { if (!data[d]) data[d] = { hue: h as number, warmth: w as number }; });
  return data;
})();

export function moodFromSummary(summary: string | null): MoodInfo {
  if (!summary) return MOOD_MAP['content'];
  const lower = summary.toLowerCase();
  for (const key of Object.keys(MOOD_MAP)) {
    if (lower.includes(key)) return MOOD_MAP[key];
  }
  if (lower.includes('happy') || lower.includes('joy')) return MOOD_MAP['joyful'];
  if (lower.includes('sad') || lower.includes('grief')) return MOOD_MAP['heavy'];
  if (lower.includes('worry') || lower.includes('stress')) return MOOD_MAP['anxious'];
  if (lower.includes('peace') || lower.includes('calm')) return MOOD_MAP['content'];
  return MOOD_MAP['content'];
}

@Injectable({ providedIn: 'root' })
export class DiaryApiService {
  private readonly baseUrl = `${environment.apiUrl}/entries`;

  constructor(private http: HttpClient) {}

  generate(req: GenerateRequest): Observable<DiaryEntry> {
    return this.http.post<DiaryEntry>(`${this.baseUrl}/generate`, req);
  }

  generateFromVoice(audioBlob: Blob, preferredLanguage: string = 'auto', entryDate?: string): Observable<DiaryEntry> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language_override', preferredLanguage);
    if (entryDate) formData.append('entry_date', entryDate);
    return this.http.post<DiaryEntry>(`${this.baseUrl}/voice-generate`, formData);
  }

  getAvailableDates(): Observable<{ dates: string[] }> {
    return this.http.get<{ dates: string[] }>(`${this.baseUrl}/available-dates`);
  }

  getEntries(skip = 0, limit = 30): Observable<DiaryEntry[]> {
    const params = new HttpParams().set('skip', skip).set('limit', limit);
    return this.http.get<DiaryEntry[]>(`${this.baseUrl}/`, { params });
  }

  getEntry(id: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`${this.baseUrl}/${id}`);
  }

  deleteEntry(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.baseUrl}/${id}`);
  }

  patchEntry(id: string, patch: {
    content_edit?: string | null;
    title_edit?: string | null;
    emojis?: string[];
    emotion_flag?: EmotionFlag | null;
    is_hidden?: boolean;
  }): Observable<DiaryEntry> {
    return this.http.patch<DiaryEntry>(`${this.baseUrl}/${id}`, patch);
  }

  uploadImage(entryId: string, file: File): Observable<ImageAsset> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<ImageAsset>(`${this.baseUrl}/${entryId}/images`, form);
  }

  deleteImage(entryId: string, publicId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${entryId}/images/${encodeURIComponent(publicId)}`);
  }

  addComment(entryId: string, text: string): Observable<EntryComment> {
    return this.http.post<EntryComment>(`${this.baseUrl}/${entryId}/comments`, { text });
  }

  deleteComment(entryId: string, commentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${entryId}/comments/${commentId}`);
  }

  getOnThisDay(): Observable<DiaryEntry[]> {
    return this.http.get<DiaryEntry[]>(`${this.baseUrl}/on-this-day/all`);
  }

  getStreak(): Observable<{ streak: number; total_entries: number; last_milestone: number | null; next_milestone: number | null; entries_to_next: number | null }> {
    return this.http.get<any>(`${this.baseUrl}/streak`);
  }

  getWeeklyLetter(): Observable<{ letter: string | null; entry_count: number; message?: string }> {
    return this.http.get<any>(`${this.baseUrl}/weekly-letter`);
  }

  getMemoryThreads(): Observable<{ threads: any[]; entry_count: number; message?: string }> {
    return this.http.get<any>(`${this.baseUrl}/memory-threads`);
  }

  askPastSelf(question: string): Observable<{ answer: string }> {
    return this.http.post<any>(`${this.baseUrl}/ask`, { question });
  }

  createShareLink(entryId: string): Observable<{ token: string; expires_at: string }> {
    return this.http.post<any>(`${this.baseUrl}/${entryId}/share`, {});
  }

  getSharedEntry(token: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`${this.baseUrl}/shared/${token}`);
  }

  exportPdfUrl(): string {
    return `${this.baseUrl}/export/pdf`;
  }

  checkHealth(): Observable<{ status: string; ollama: string; model: string; memory_entries: number }> {
    return this.http.get<any>('http://localhost:9000/health');
  }
}
