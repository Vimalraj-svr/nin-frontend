import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirm = '';
  revealPassword = false;
  loading = signal(false);
  done = signal(false);
  error = signal('');
  private token = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    if (auth.getToken()) this.router.navigate(['/']);
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.error.set('Invalid reset link. Please request a new one.');
  }

  submit() {
    if (!this.password || !this.confirm) return;
    if (this.password !== this.confirm) {
      this.error.set('Passphrases do not match.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Passphrase must be at least 6 characters.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: err => {
        this.error.set(err?.error?.detail ?? 'Something went wrong. Please request a new link.');
        this.loading.set(false);
      },
    });
  }
}
