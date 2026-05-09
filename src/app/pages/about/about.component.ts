import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface TocItem { id: string; label: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
  activeSection = signal('overview');
  isLoggedIn = false;
  isNewUser = false;

  readonly toc: TocItem[] = [
    { id: 'overview',  label: 'What is Ninaivugal?' },
    { id: 'today',     label: 'Today' },
    { id: 'confide',   label: 'Confide' },
    { id: 'chronicle', label: 'Chronicle' },
    { id: 'kin',       label: 'Kin' },
    { id: 'weave',     label: 'Weave' },
    { id: 'echo',      label: 'Echo' },
    { id: 'sanctum',   label: 'Sanctum' },
    { id: 'languages', label: 'Languages' },
    { id: 'limits',    label: 'Limits & Rules' },
    { id: 'privacy',   label: 'Privacy' },
  ];

  constructor(private router: Router, public auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe(u => {
      this.isLoggedIn = !!u;
      this.isNewUser = !!u && !u.onboarding_complete;
    });

    // Set up IntersectionObserver after a tick
    setTimeout(() => this.observeSections(), 100);
  }

  private observeSections() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) this.activeSection.set(e.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    this.toc.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  begin() {
    this.auth.updateProfile({ onboarding_complete: true }).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
