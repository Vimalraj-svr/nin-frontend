import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = '';
  password = '';
  revealPassword = false;
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (auth.getToken()) this.router.navigate(['/']);
  }

  submit() {
    if (!this.email.trim() || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.error.set(err?.error?.detail ?? 'Incorrect email or password.');
        this.loading.set(false);
      },
    });
  }
}
