import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OnboardingComponent } from '../../components/onboarding/onboarding.component';
import { MoodEmojiComponent } from '../../components/mood-emoji/mood-emoji.component';
import { OrbComponent } from '../../components/orb/orb.component';
import { DiaryApiService, moodFromSummary, MoodInfo } from '../../services/diary-api.service';
import { DiaryEntry } from '../../models/diary.model';
import { AuthService } from '../../services/auth.service';
import { localizedBrandMark, localizedMoodLabel, shouldShowLocalizedCompanion, uiLanguageForPreference } from '../../utils/ui-language';
import { firstName, withName, withNativeName } from '../../utils/personalize';

interface CalDay { d: number; dow: string; hue?: number; warmth?: number; today: boolean; label: string; isoDate: string; }

const LANG_LABELS: Record<string, string> = {
  ta: 'Tamil', en: 'English', hi: 'Hindi', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam',
};
const MODE_LABELS: Record<string, string> = {
  SAME_LANGUAGE: 'Same language', ENGLISH_REFINED: 'English', BILINGUAL: 'Bilingual',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MoodEmojiComponent, OnboardingComponent, OrbComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  calDays: CalDay[] = [];
  apiEntries = signal<DiaryEntry[]>([]);
  onThisDay = signal<DiaryEntry[]>([]);
  selectedDate = signal<string | null>(null);
  loading = signal(true);
  showOnboarding = false;
  birthdayWish = signal<string | null>(null);

  constructor(private router: Router, private api: DiaryApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getEntries(0, 50).subscribe({
      next: entries => {
        this.apiEntries.set(entries);
        this.buildCalendar(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.buildCalendar([]);

    // Check onboarding after user loads
    this.auth.user$.subscribe(u => {
      if (u && !u.onboarding_complete) {
        this.showOnboarding = true;
      }
    });

    // Check for birthday wish
    this.auth.getBirthdayWish().subscribe({
      next: r => { if (r.wish) this.birthdayWish.set(r.wish); },
      error: () => {},
    });

    // On this day
    this.api.getOnThisDay().subscribe({
      next: entries => this.onThisDay.set(entries),
      error: () => {},
    });
  }

  private localDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private buildCalendar(entries: DiaryEntry[]) {
    const dows = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = new Date();

    const entryByDay = new Map<string, DiaryEntry>();
    entries.forEach(e => {
      const key = this.localDate(new Date(e.created_at));
      if (!entryByDay.has(key)) entryByDay.set(key, e);
    });

    this.calDays = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = this.localDate(d);
      const entry = entryByDay.get(key);
      const mood = entry ? moodFromSummary(entry.mood_summary) : undefined;
      this.calDays.push({
        d: d.getDate(),
        dow: dows[d.getDay()],
        hue: mood?.hue,
        warmth: mood?.warmth,
        today: i === 0,
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        isoDate: key,
      });
    }
  }

  get firstName(): string { return firstName(this.auth.currentUser?.name); }

  get greeting(): string {
    const h = new Date().getHours();
    const day = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const name = this.firstName;
    return name ? `Good ${period}, ${name} · ${date}` : `${day} ${period} · ${date}`;
  }

  get heroQuestion(): string {
    const h = new Date().getHours();
    const n = withName(this.auth.currentUser?.name);
    if (h < 12) return `What has the morning brought you${n}?`;
    if (h < 17) return `What is on your mind right now${n}?`;
    return `How did the day leave you${n}?`;
  }

  get localGreeting(): string {
    const h = new Date().getHours();
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    const n = this.firstName;
    const nn = withNativeName(this.auth.currentUser?.name_native);
    if (lang === 'ta') {
      if (h < 12) return `இன்று காலை என்ன நினைக்கிறீர்கள்${nn}?`;
      if (h < 17) return `இன்று என்ன நடந்தது${nn}?`;
      return `இன்றைய நாள் எப்படி இருந்தது${nn}?`;
    }
    if (lang === 'hi') {
      if (h < 12) return `आज सुबह ने आपको क्या महसूस कराया${nn}?`;
      if (h < 17) return `अभी आपके मन में क्या चल रहा है${nn}?`;
      return `आज का दिन आपको कैसा छोड़ गया${nn}?`;
    }
    if (lang === 'ml') {
      if (h < 12) return `ഇന്നത്തെ രാവിലെ നിങ്ങളിലേക്ക് എന്താണ് കൊണ്ടുവന്നത്${nn}?`;
      if (h < 17) return `ഇപ്പോൾ നിങ്ങളുടെ മനസിൽ എന്താണ്${nn}?`;
      return `ഇന്നത്തെ ദിവസം നിങ്ങളെ എങ്ങനെ വിട്ടുപോയി${nn}?`;
    }
    if (lang === 'te') {
      if (h < 12) return `ఈ ఉదయం మీలో ఏమి మిగిల్చింది${nn}?`;
      if (h < 17) return `ఇప్పుడే మీ మనసులో ఏముంది${nn}?`;
      return `ఈ రోజు మీను ఎలా విడిచింది${nn}?`;
    }
    if (lang === 'kn') {
      if (h < 12) return `ಇಂದಿನ ಬೆಳಗ್ಗೆ ನಿಮಗೆ ಏನು ತಂದಿತು${nn}?`;
      if (h < 17) return `ಈಗ ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿ ಏನು ಇದೆ${nn}?`;
      return `ಇಂದಿನ ದಿನ ನಿಮ್ಮನ್ನು ಹೇಗೆ ಬಿಟ್ಟಿತು${nn}?`;
    }
    if (h < 12) return `What has the morning brought you${withName(this.auth.currentUser?.name)}?`;
    if (h < 17) return `What is on your mind right now${withName(this.auth.currentUser?.name)}?`;
    return `How did the day leave you${withName(this.auth.currentUser?.name)}?`;
  }

  get showLocalGreeting(): boolean {
    return shouldShowLocalizedCompanion(this.auth.currentUser?.preferred_language);
  }

  get hasEntries(): boolean { return this.apiEntries().length > 0; }
  get hasTodayEntry(): boolean {
    const today = this.localDate(new Date());
    return this.apiEntries().some(e => this.localDate(new Date(e.created_at)) === today);
  }
  get featured(): DiaryEntry | null { return this.apiEntries()[0] ?? null; }
  get displayEntries(): DiaryEntry[] {
    const date = this.selectedDate();
    if (!date) return this.apiEntries().slice(0, 6);
    return this.apiEntries().filter(e => this.localDate(new Date(e.created_at)) === date);
  }
  get totalCount(): number { return this.apiEntries().length; }

  selectDay(day: CalDay) {
    this.selectedDate.set(this.selectedDate() === day.isoDate ? null : day.isoDate);
  }

  clearDateFilter() { this.selectedDate.set(null); }

  moodOf(e: DiaryEntry): MoodInfo { return moodFromSummary(e.mood_summary); }

  moodLabel(e: DiaryEntry): string {
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    return localizedMoodLabel(moodFromSummary(e.mood_summary).primary, lang);
  }

  entryTitle(e: DiaryEntry): string {
    return e.title_edit ?? e.title_original ?? e.title_english ?? 'Untitled';
  }

  entryPreview(e: DiaryEntry): string {
    const text = e.content_edit ?? e.content_original ?? e.content_english ?? e.transcript ?? '';
    const clean = text.replace(/\n+/g, ' ').trim();
    return clean.length > 130 ? clean.slice(0, 130) + '…' : clean;
  }

  entryLang(e: DiaryEntry): string {
    return LANG_LABELS[e.detected_language ?? ''] ?? 'Multilingual';
  }

  entryMode(e: DiaryEntry): string {
    return MODE_LABELS[e.output_mode ?? ''] ?? '';
  }

  entryWordCount(e: DiaryEntry): number {
    const text = e.content_original ?? e.content_english ?? e.transcript ?? '';
    return text.split(/\s+/).filter(Boolean).length;
  }

  openEntry(id: string) { this.router.navigate(['/entry', id]); }
  compose() { this.router.navigate(['/compose']); }
  formatTime(d: string) { return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  formatDay(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  formatYear(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  brandMark(): string {
    return localizedBrandMark(this.auth.currentUser?.preferred_language);
  }
}
