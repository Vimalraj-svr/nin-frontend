import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  sent = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (auth.getToken()) this.router.navigate(['/']);
  }

  submit() {
    if (!this.email.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: err => {
        this.error.set(err?.error?.detail ?? 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
