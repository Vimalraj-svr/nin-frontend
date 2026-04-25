import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PersonalDetails } from '../../services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent {
  @Input() userName = '';
  @Output() done = new EventEmitter<void>();

  details: PersonalDetails = {};
  saving = signal(false);

  constructor(private auth: AuthService) {}

  skip() {
    this.auth.updateProfile({ onboarding_complete: true }).subscribe(() => this.done.emit());
  }

  save() {
    if (this.saving()) return;
    this.saving.set(true);
    const hasAny = Object.values(this.details).some(v => v?.trim());
    this.auth.updateProfile({
      personal_details: hasAny ? this.details : undefined,
      onboarding_complete: true,
    }).subscribe({
      next: () => { this.saving.set(false); this.done.emit(); },
      error: () => this.saving.set(false),
    });
  }
}
