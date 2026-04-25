import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile, PersonalDetails } from '../../services/auth.service';
import { normalizePreferredLanguage } from '../../utils/ui-language';

interface LangOption {
  value: string;
  label: string;
  script?: string;
  desc: string;
}

const LANGUAGES: LangOption[] = [
  { value: 'auto',      label: 'Auto-detect',  desc: 'Keep whatever language you naturally speak in.' },
  { value: 'bilingual', label: 'Bilingual',     desc: 'Your original voice + a graceful English version side by side.' },
  { value: 'en',        label: 'English',       script: 'English', desc: 'Shape everything into expressive English, regardless of input.' },
  { value: 'ta',        label: 'Tamil',         script: 'தமிழ்',   desc: 'Every entry written in Tamil — even if you spoke in a mix.' },
  { value: 'hi',        label: 'Hindi',         script: 'हिंदी',   desc: 'Every entry written in Hindi.' },
  { value: 'ml',        label: 'Malayalam',     script: 'മലയാളം', desc: 'Every entry written in Malayalam.' },
  { value: 'te',        label: 'Telugu',        script: 'తెలుగు',  desc: 'Every entry written in Telugu.' },
  { value: 'kn',        label: 'Kannada',       script: 'ಕನ್ನಡ',  desc: 'Every entry written in Kannada.' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  languages = LANGUAGES;
  user = signal<UserProfile | null>(null);
  selectedLang = signal('auto');
  saving = signal(false);
  saved = signal(false);

  // Reminders
  reminderEnabled = signal(false);

  // Account edits
  editName = '';
  editBirthday = '';
  accountSaving = signal(false);
  accountSaved = signal(false);

  // Personal details
  details: PersonalDetails = {};
  detailsSaving = signal(false);
  detailsSaved = signal(false);

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }

  ngOnInit() {
    this.auth.loadCurrentUser();
    this.auth.user$.subscribe(u => {
      this.user.set(u);
      if (u) {
        this.selectedLang.set(normalizePreferredLanguage(u.preferred_language));
        this.reminderEnabled.set(u.reminder_enabled ?? false);
        this.editName = u.name ?? '';
        this.editBirthday = u.birthday ?? '';
        if (u.personal_details) {
          this.details = { ...u.personal_details };
        }
      }
    });
  }

  selectLang(value: string) { this.selectedLang.set(value); }

  savePreferences() {
    if (this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.auth.updateProfile({
      preferred_language: this.selectedLang(),
      reminder_enabled: this.reminderEnabled(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: () => this.saving.set(false),
    });
  }

  savePersonalDetails() {
    if (this.detailsSaving()) return;
    this.detailsSaving.set(true);
    this.detailsSaved.set(false);
    this.auth.updateProfile({ personal_details: this.details }).subscribe({
      next: () => {
        this.detailsSaving.set(false);
        this.detailsSaved.set(true);
        setTimeout(() => this.detailsSaved.set(false), 2500);
      },
      error: () => this.detailsSaving.set(false),
    });
  }

  saveAccount() {
    if (this.accountSaving() || !this.editName.trim()) return;
    this.accountSaving.set(true);
    this.accountSaved.set(false);
    this.auth.updateProfile({
      name: this.editName.trim(),
      birthday: this.editBirthday || undefined,
    }).subscribe({
      next: () => {
        this.accountSaving.set(false);
        this.accountSaved.set(true);
        setTimeout(() => this.accountSaved.set(false), 2500);
      },
      error: () => this.accountSaving.set(false),
    });
  }

  get accountChanged(): boolean {
    const u = this.user();
    if (!u) return false;
    return this.editName.trim() !== u.name || (this.editBirthday || '') !== (u.birthday || '');
  }

  get langChanged(): boolean {
    return this.selectedLang() !== normalizePreferredLanguage(this.user()?.preferred_language);
  }

  get remindersChanged(): boolean {
    return this.reminderEnabled() !== (this.user()?.reminder_enabled ?? false);
  }

  get prefsChanged(): boolean {
    return this.langChanged || this.remindersChanged;
  }

  get currentLangLabel(): string {
    return LANGUAGES.find(l => l.value === this.selectedLang())?.label ?? 'Auto-detect';
  }
}
