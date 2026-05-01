import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiaryApiService, moodFromSummary } from '../../services/diary-api.service';
import { DiaryEntry, LANGUAGE_DISPLAY, EMOTION_FLAGS } from '../../models/diary.model';
import { OrbComponent } from '../../components/orb/orb.component';

const EMOTION_FLAG_MAP = new Map(EMOTION_FLAGS.map(f => [f.value, f]));

export interface EntryGroup {
  monthKey: string;
  label: string;
  entries: DiaryEntry[];
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, OrbComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  entries: DiaryEntry[] = [];
  loading = true;
  error: string | null = null;
  deletingId: string | null = null;
  deleteConfirmId: string | null = null;

  viewMode = signal<'timeline' | 'grid'>('timeline');
  searchQuery = '';

  constructor(private api: DiaryApiService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getEntries(0, 100).subscribe({
      next: data => { this.entries = data; this.loading = false; },
      error: () => { this.error = 'Failed to load entries.'; this.loading = false; },
    });
  }

  get filteredEntries(): DiaryEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.entries.filter(e => !e.is_hidden);
    return this.entries.filter(e =>
      !e.is_hidden &&
      [e.title_original, e.title_english, e.content_original, e.content_english]
        .some(t => t?.toLowerCase().includes(q))
    );
  }

  get groupedEntries(): EntryGroup[] {
    const groups = new Map<string, DiaryEntry[]>();
    for (const e of this.filteredEntries) {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return Array.from(groups.entries()).map(([key, entries]) => ({
      monthKey: key,
      label: new Date(entries[0].created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      entries,
    }));
  }

  entryDay(d: string) { return new Date(d).getDate(); }
  entryDow(d: string) { return new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(); }
  entryTime(d: string) { return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  entryTitle(e: DiaryEntry) { return e.title_original ?? e.title_english ?? 'Untitled'; }
  entryPreview(e: DiaryEntry) {
    const t = e.content_original ?? e.content_english ?? e.transcript ?? '';
    const clean = t.replace(/\n+/g, ' ').trim();
    return clean.length > 200 ? clean.slice(0, 200) + '…' : clean;
  }
  entryLang(e: DiaryEntry) { return LANGUAGE_DISPLAY[e.detected_language ?? '']?.label ?? 'Unknown'; }
  moodOf(e: DiaryEntry) { return moodFromSummary(e.mood_summary); }
  emotionOf(e: DiaryEntry) { return e.emotion_flag ? EMOTION_FLAG_MAP.get(e.emotion_flag) ?? null : null; }

  openEntry(id: string) { this.router.navigate(['/entry', id]); }
  compose() { this.router.navigate(['/compose']); }

  confirmDelete(ev: MouseEvent, id: string) { ev.stopPropagation(); this.deleteConfirmId = id; }
  cancelDelete(ev: MouseEvent) { ev.stopPropagation(); this.deleteConfirmId = null; }
  doDelete(ev: MouseEvent, id: string) {
    ev.stopPropagation();
    this.deletingId = id;
    this.deleteConfirmId = null;
    this.api.deleteEntry(id).subscribe({
      next: () => { this.entries = this.entries.filter(en => en.id !== id); this.deletingId = null; },
      error: () => { this.deletingId = null; },
    });
  }
}
