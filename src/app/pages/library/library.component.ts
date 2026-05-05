import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MoodEmojiComponent } from '../../components/mood-emoji/mood-emoji.component';
import { DiaryApiService, moodFromSummary, MoodInfo } from '../../services/diary-api.service';
import { DiaryEntry } from '../../models/diary.model';
import { AuthService } from '../../services/auth.service';
import { localizedBrandMark, localizedMoodLabel, shouldShowLocalizedCompanion, uiLanguageForPreference } from '../../utils/ui-language';

const LANG_LABELS: Record<string, string> = {
  ta: 'Tamil', en: 'English', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada',
};
const MODE_LABELS: Record<string, string> = {
  SAME_LANGUAGE: 'Same language', ENGLISH_REFINED: 'English', BILINGUAL: 'Bilingual',
};

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [MoodEmojiComponent],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css',
})
export class LibraryComponent implements OnInit {
  activeFilter = 'all';
  entries = signal<DiaryEntry[]>([]);
  loading = signal(true);
  hiddenEntries = signal<DiaryEntry[]>([]);
  showVault = signal(false);
  vaultLoading = signal(false);

  readonly dynamicFilters = computed(() => {
    const seen = new Set<string>();
    const result: { id: string; label: string }[] = [{ id: 'all', label: 'all' }];
    for (const entry of this.entries()) {
      const primary = moodFromSummary(entry.mood_summary).primary;
      if (!seen.has(primary)) {
        seen.add(primary);
        result.push({ id: primary, label: primary });
      }
    }
    return result;
  });

  constructor(private router: Router, private api: DiaryApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getEntries(0, 100).subscribe({
      next: e => { this.entries.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleVault() {
    if (!this.showVault() && this.hiddenEntries().length === 0) {
      this.vaultLoading.set(true);
      this.api.getHiddenEntries().subscribe({
        next: e => { this.hiddenEntries.set(e); this.vaultLoading.set(false); },
        error: () => this.vaultLoading.set(false),
      });
    }
    this.showVault.update(v => !v);
  }

  unhide(entry: DiaryEntry, event: Event) {
    event.stopPropagation();
    this.api.patchEntry(entry.id, { is_hidden: false }).subscribe({
      next: () => this.hiddenEntries.update(list => list.filter(e => e.id !== entry.id)),
    });
  }

  get filtered(): DiaryEntry[] {
    const all = this.entries();
    if (this.activeFilter === 'all') return all;
    return all.filter(e => this.moodOf(e).primary === this.activeFilter);
  }

  moodOf(e: DiaryEntry): MoodInfo { return moodFromSummary(e.mood_summary); }

  entryTitle(e: DiaryEntry): string {
    return e.title_original ?? e.title_english ?? 'Untitled';
  }

  entryPreview(e: DiaryEntry): string {
    const text = e.content_original ?? e.content_english ?? e.transcript ?? '';
    const clean = text.replace(/\n+/g, ' ').trim();
    return clean.length > 120 ? clean.slice(0, 120) + '…' : clean;
  }

  entryLang(e: DiaryEntry): string {
    return LANG_LABELS[e.detected_language ?? ''] ?? 'Multilingual';
  }

  entryMode(e: DiaryEntry): string {
    return MODE_LABELS[e.output_mode ?? ''] ?? '';
  }

  formatDay(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  localHeading(): string {
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    if (lang === 'ta') return 'உங்கள் நினைவுகள்';
    if (lang === 'hi') return 'आपकी यादें';
    if (lang === 'ml') return 'നിങ്ങളുടെ ഓർമ്മകൾ';
    if (lang === 'te') return 'మీ జ్ఞాపకాలు';
    if (lang === 'kn') return 'ನಿಮ್ಮ ನೆನಪುಗಳು';
    return 'Your memories';
  }

  filterLabel(primary: string): string {
    if (primary === 'all') return 'All';
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    return localizedMoodLabel(primary, lang);
  }

  moodLabel(e: DiaryEntry): string {
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    return localizedMoodLabel(moodFromSummary(e.mood_summary).primary, lang);
  }

  brandMark(): string {
    return localizedBrandMark(this.auth.currentUser?.preferred_language);
  }

  showLocalHeading(): boolean {
    return shouldShowLocalizedCompanion(this.auth.currentUser?.preferred_language);
  }

  openEntry(id: string) { this.router.navigate(['/entry', id]); }
}
