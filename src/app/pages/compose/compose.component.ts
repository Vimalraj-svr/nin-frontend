import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DiaryApiService } from '../../services/diary-api.service';
import { AuthService } from '../../services/auth.service';
import { GenerateRequest } from '../../models/diary.model';
import { normalizePreferredLanguage, shouldShowLocalizedCompanion, uiLanguageForPreference } from '../../utils/ui-language';
import { firstName, withName, withNativeName } from '../../utils/personalize';

const LANG_LABELS: Record<string, string> = {
  // auto:      'Auto-detect — keep your natural voice',
  bilingual: 'Bilingual — original + English side by side',
  en:        'English — shaped into expressive English',
  ta:        'Tamil — தமிழில் எழுதப்படும்',
  hi:        'Hindi — हिंदी में लिखा जाएगा',
  ml:        'Malayalam — മലയാളത്തിൽ',
  te:        'Telugu — తెలుగులో',
  kn:        'Kannada — ಕನ್ನಡದಲ್ಲಿ',
};

const SUGGESTIONS = [
  'What surprised you today?',
  'Describe one moment in detail — just one.',
  'What are you carrying right now?',
  'Who made you feel seen today?',
  'What do you wish you had said?',
  'What smell, sound, or texture stays with you?',
  'What would yesterday-you want to know?',
  'What shifted inside you this week?',
  'When did time feel different today?',
  'What small thing went unnoticed by everyone but you?',
];

function detectLangs(text: string): string[] {
  if (!text) return [];
  const out = new Set<string>();
  if (/[a-zA-Z]/.test(text)) out.add('English');
  if (/[஀-௿]/.test(text)) out.add('Tamil');
  if (/[ऀ-ॿ]/.test(text)) out.add('Hindi');
  if (/[ഀ-ൿ]/.test(text)) out.add('Malayalam');
  if (/[ఀ-౿]/.test(text)) out.add('Telugu');
  if (/[ಀ-೿]/.test(text)) out.add('Kannada');
  if (/\b(inniki|amma|appa|iruku|mudiyala|nenju|thirakka|pannen|aachu)\b/i.test(text) && /[a-zA-Z]/.test(text)) out.add('Tanglish');
  return [...out];
}

interface AvailableDay { isoDate: string; label: string; sub: string; }

function dayLabel(isoDate: string): { label: string; sub: string } {
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dMs = new Date(isoDate + 'T12:00:00').setHours(0, 0, 0, 0);
  const diffDays = Math.round((todayMs - dMs) / 86400000);
  const dateStr = new Date(isoDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  if (diffDays === 0) return { label: 'Today', sub: dateStr };
  if (diffDays === 1) return { label: 'Yesterday', sub: dateStr };
  return { label: '2 days ago', sub: dateStr };
}

const fileToBase64 = (file: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
    };
    reader.onerror = error => reject(error);
});

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './compose.component.html',
  styleUrl: './compose.component.css',
})
export class ComposeComponent implements OnInit, OnDestroy {
  @ViewChild('ta') taRef!: ElementRef<HTMLTextAreaElement>;

  draft = '';
  inputMode = signal<'write' | 'speak' | null>(null);
  suggestions = SUGGESTIONS;
  suggestionIndex = signal(0);
  preferredLanguage = signal('auto');
  loading = false;
  error = '';

  availableDays = signal<AvailableDay[]>([]);
  selectedDate = signal<string>('');
  datesLoaded = signal(false);

  isRecording = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];

  // Recording state
  recordingSeconds = signal(0);
  recordingBlob: Blob | null = null;
  showConfirmStep = signal(false);
  isCountingDown = signal(false);
  countdown = signal(0);
  private recTimer?: ReturnType<typeof setInterval>;
  private countdownTimer?: ReturnType<typeof setInterval>;
  private pendingStream: MediaStream | null = null;
  readonly MIN_REC_SECS = 10;
  readonly MAX_REC_SECS = 120;
  readonly MIN_WORDS = 5;

  private suggestionTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private api: DiaryApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const saved = sessionStorage.getItem('nin.draft');
    if (saved) {
      this.draft = saved;
      this.inputMode.set('write');
    }

    this.auth.user$.subscribe(u => {
      if (u?.preferred_language) this.preferredLanguage.set(normalizePreferredLanguage(u.preferred_language));
    });

    this.api.getAvailableDates().subscribe({
      next: ({ dates }) => {
        const days = dates.map(d => ({ isoDate: d, ...dayLabel(d) }));
        this.availableDays.set(days);
        if (days.length > 0) this.selectedDate.set(days[0].isoDate);
        this.datesLoaded.set(true);
      },
      error: () => {
        const today = new Date().toISOString().slice(0, 10);
        this.availableDays.set([{ isoDate: today, ...dayLabel(today) }]);
        this.selectedDate.set(today);
        this.datesLoaded.set(true);
      },
    });

    this.suggestionTimer = setInterval(() => {
      this.suggestionIndex.update(i => (i + 1) % this.suggestions.length);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.suggestionTimer) clearInterval(this.suggestionTimer);
    if (this.recTimer) clearInterval(this.recTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.pendingStream?.getTracks().forEach(t => t.stop());
  }

  get firstName(): string { return firstName(this.auth.currentUser?.name); }
  get currentSuggestion(): string { return this.suggestions[this.suggestionIndex()]; }
  get langLabel(): string { return LANG_LABELS[this.preferredLanguage()] ?? this.preferredLanguage(); }
  get langs(): string[] { return detectLangs(this.draft); }
  get wordCount(): number { return this.draft.trim().split(/\s+/).filter(Boolean).length; }
  get canGenerate(): boolean { return this.wordCount >= this.MIN_WORDS && !this.loading && this.availableDays().length > 0; }
  get tooShort(): boolean { return this.draft.trim().length > 0 && this.wordCount < this.MIN_WORDS; }
  get localPromptLine(): string {
    const lang = uiLanguageForPreference(this.auth.currentUser?.preferred_language);
    const nn = withNativeName(this.auth.currentUser?.name_native);
    if (lang === 'ta') return `மனசுல இருப்பதை எழுதுங்க${nn}`;
    if (lang === 'hi') return `दिल में जो है, उसे लिखिए${nn}`;
    if (lang === 'ml') return `മനസ്സിലുള്ളത് എഴുതൂ${nn}`;
    if (lang === 'te') return `మనసులో ఉన్నది రాయండి${nn}`;
    if (lang === 'kn') return `ಮನಸ್ಸಿನಲ್ಲಿ ಇರುವುದನ್ನು ಬರೆಯಿರಿ${nn}`;
    return `Write what is on your mind${withName(this.auth.currentUser?.name)}`;
  }

  get showLocalPromptLine(): boolean {
    return shouldShowLocalizedCompanion(this.auth.currentUser?.preferred_language);
  }

  useSuggestion() {
    this.draft = this.draft ? this.draft + ' ' + this.currentSuggestion + ' ' : this.currentSuggestion + ' ';
    this.onInput();
    setTimeout(() => this.taRef?.nativeElement.focus(), 0);
  }

  nextSuggestion() {
    this.suggestionIndex.update(i => (i + 1) % this.suggestions.length);
  }

  onInput() {
    sessionStorage.setItem('nin.draft', this.draft);
    const ta = this.taRef?.nativeElement;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.max(240, ta.scrollHeight) + 'px'; }
  }

  async toggleRecording() {
    if (this.isCountingDown()) {
      this.cancelCountdown();
      return;
    }
    if (this.isRecording) {
      if (this.recordingSeconds() < this.MIN_REC_SECS) return;
      this.stopRecording();
    } else {
      this.error = '';
      this.recordingBlob = null;
      this.showConfirmStep.set(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.pendingStream = stream;
        this.isCountingDown.set(true);
        this.countdown.set(3);
        this.countdownTimer = setInterval(() => {
          this.countdown.update(n => {
            if (n <= 1) {
              clearInterval(this.countdownTimer);
              this.isCountingDown.set(false);
              this.pendingStream = null;
              this.startMediaRecorder(stream);
              return 0;
            }
            return n - 1;
          });
        }, 1000);
      } catch (err: any) {
        this.error = err?.name === 'NotAllowedError'
          ? 'Microphone access denied. Allow it in your browser settings.'
          : 'Could not access microphone.';
      }
    }
  }

  private cancelCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.isCountingDown.set(false);
    this.countdown.set(0);
    this.pendingStream?.getTracks().forEach(t => t.stop());
    this.pendingStream = null;
  }

  private startMediaRecorder(stream: MediaStream) {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    this.mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (this.recTimer) clearInterval(this.recTimer);
      const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      this.recordingBlob = blob;
      this.showConfirmStep.set(true);
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    this.recordingSeconds.set(0);
    this.recTimer = setInterval(() => {
      this.recordingSeconds.update(s => {
        const next = s + 1;
        if (next >= this.MAX_REC_SECS) this.stopRecording();
        return next;
      });
    }, 1000);
  }

  private stopRecording() {
    if (this.recTimer) clearInterval(this.recTimer);
    this.mediaRecorder?.stop();
    this.isRecording = false;
  }

  confirmSend() {
    if (!this.recordingBlob) return;
    const blob = this.recordingBlob;
    this.recordingBlob = null;
    this.showConfirmStep.set(false);
    this.generateFromVoice(blob);
  }

  discardRecording() {
    this.recordingBlob = null;
    this.showConfirmStep.set(false);
    this.recordingSeconds.set(0);
  }

  formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  chooseMode(mode: 'write' | 'speak') {
    this.inputMode.set(mode);
    if (mode === 'write') {
      setTimeout(() => this.taRef?.nativeElement.focus(), 0);
    }
  }

  async generateFromVoice(audioBlob: Blob) {
    this.loading = true;
    this.error = '';

    try {
      const base64Data = await fileToBase64(audioBlob);
      sessionStorage.setItem('nin.pendingAudio', base64Data);
      sessionStorage.setItem('nin.pendingLang', this.preferredLanguage());
      sessionStorage.setItem('nin.pendingDate', this.selectedDate());
      this.router.navigate(['/generating'], { state: { voiceMode: true } });
    } catch (err: any) {
      this.error = 'Failed to prepare your recording. Please try again.';
      this.loading = false;
    }
  }

  generate() {
    if (!this.canGenerate) return;
    const req: GenerateRequest = {
      transcript: this.draft.trim(),
      output_mode: 'auto' as any,
      language_override: this.preferredLanguage(),
      entry_date: this.selectedDate(),
    };
    this.loading = true;
    this.error = '';
    sessionStorage.setItem('nin.pendingDraft', this.draft);
    sessionStorage.setItem('nin.pendingLang', this.preferredLanguage());
    sessionStorage.setItem('nin.pendingDate', this.selectedDate());
    this.router.navigate(['/generating'], { state: { req } });
  }
}
