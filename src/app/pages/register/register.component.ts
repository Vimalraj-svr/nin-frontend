import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface LangChip {
  id: string;
  label: string;
  script?: string;
  backendValue: string;
}

const LANG_CHIPS: LangChip[] = [
  { id: 'ta',        label: 'Tamil',       script: 'தமிழ்',   backendValue: 'ta'        },
  { id: 'en',        label: 'English',     script: undefined,  backendValue: 'en'        },
  { id: 'hi',        label: 'Hindi',       script: 'हिन्दी',  backendValue: 'hi'        },
  { id: 'ml',        label: 'Malayalam',   script: 'മലയാളം',  backendValue: 'ml'        },
  { id: 'te',        label: 'Telugu',      script: 'తెలుగు',  backendValue: 'te'        },
  { id: 'kn',        label: 'Kannada',     script: 'ಕನ್ನಡ',   backendValue: 'kn'        },
  { id: 'bilingual', label: 'Bilingual',   script: undefined,  backendValue: 'bilingual' },
  // { id: 'auto',      label: 'Auto-detect', script: undefined,  backendValue: 'auto'      },
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  langChips = LANG_CHIPS;
  strengthSegments = [0, 1, 2, 3];

  name = '';
  email = '';
  birthday = '';
  password = '';
  confirmPassword = '';
  selectedLangId = '';
  revealPassword = false;
  passwordStrength = 0;
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (auth.getToken()) this.router.navigate(['/']);
  }

  selectLang(id: string) { this.selectedLangId = id; }

  onPasswordChange() {
    const pw = this.password;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    this.passwordStrength = s;
  }

  get strengthLabel(): string {
    return ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'][this.passwordStrength];
  }

  get canSubmit(): boolean {
    return !this.loading() &&
      this.name.trim().length >= 2 &&
      this.email.trim().length > 0 &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword &&
      this.selectedLangId.length > 0;
  }

  submit() {
    if (!this.canSubmit) return;
    const chip = this.langChips.find(l => l.id === this.selectedLangId);
    const preferred_language = chip?.backendValue ?? 'auto';

    this.loading.set(true);
    this.error.set('');
    this.auth.register({
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      preferred_language,
      birthday: this.birthday || undefined,
    }).subscribe({
      next: () => {
        this.auth.login(this.email.trim(), this.password).subscribe({
          next: () => this.router.navigate(['/']),
          error: () => this.router.navigate(['/login']),
        });
      },
      error: err => {
        this.error.set(err?.error?.detail ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
