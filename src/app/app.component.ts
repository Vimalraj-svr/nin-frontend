import { Component, HostListener, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { DiaryApiService } from './services/diary-api.service';
import { OrbComponent } from './components/orb/orb.component';

interface NavItem { id: string; label: string; sub: string; route: string; k: string; icon: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'home',     label: 'Today',   sub: 'this moment',       route: '/',        k: 'H', icon: '◎' },
  { id: 'compose',  label: 'Pour',    sub: 'new entry',         route: '/compose', k: 'W', icon: '✍' },
  { id: 'pages',    label: 'Pages',   sub: 'your full story',   route: '/pages',   k: 'J', icon: '◷' },
  { id: 'reflect',  label: 'Weave',   sub: 'threads & letters', route: '/reflect', k: 'R', icon: '◈' },
  { id: 'chat',     label: 'Commune', sub: 'ask your diary',    route: '/chat',    k: 'C', icon: '◉' },
  { id: 'settings', label: 'Sanctum', sub: 'your space',        route: '/settings',k: 'S', icon: '⚙' },
];

const AUTH_ROUTES = ['/login', '/register', '/shared', '/forgot-password', '/reset-password'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, OrbComponent],
  template: `
    @if (isAuthPage()) {
      <!-- Auth pages: full-screen, no sidebar -->
      <router-outlet />
    } @else {
      <div class="app">
        <aside class="sidebar">
          <div class="brand" (click)="nav('/')">
            <img src="/assets/logos/monoline_logo.png" class="brand-mark-img" alt="Ninaivugal" style="height: auto;"/>
            <div class="tag">a diary, in your own tongue</div>
          </div>

          <nav class="nav">
            @for (item of navItems; track item.id) {
              @if (item.id === 'settings') {
                <div class="nav-sep"></div>
              }
              <button
                class="nav-item"
                [class.active]="activeRoute() === item.id"
                (click)="nav(item.route)"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">
                  <span class="nav-label-main">{{ item.label }}</span>
                  <span class="nav-label-sub">{{ item.sub }}</span>
                </span>
                <span class="k">{{ item.k }}</span>
              </button>
            }
          </nav>

          <div class="sidebar-footer">
            @if (sidebarStreak() > 0) {
              <div class="streak">
                <span class="num">{{ sidebarStreak() }}</span>
                <span class="lbl">day streak</span>
              </div>
            }

            @if (auth.user$ | async; as user) {
              <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-mute);border-top:1px solid var(--rule);padding-top:12px;margin-top:4px">
                <div style="color:var(--ink-soft);font-family:var(--serif);font-style:italic;font-size:14px;margin-bottom:4px">{{ user.name }}</div>
                <div style="margin-bottom:8px">{{ user.email }}</div>
                <button (click)="auth.logout()" style="background:none;border:none;cursor:pointer;font-family:inherit;font-size:inherit;letter-spacing:inherit;text-transform:inherit;color:var(--ink-mute);padding:0">
                  Sign out →
                </button>
              </div>
            }
          </div>
        </aside>

        <div class="main">
          <div class="topbar">
            <div class="crumb">{{ crumb() }}</div>
            <div style="display:flex;align-items:center;gap:0.625rem">
              <app-orb [hue]="dayOrb.hue" [warmth]="dayOrb.warmth" size="xs" [breathing]="true" />
              <div class="date">{{ today }}</div>
            </div>
          </div>
          <router-outlet />
        </div>

        <!-- Mobile bottom nav (hidden ≥880px via CSS) -->
        <nav class="bottom-nav">
          @for (item of navItems; track item.id) {
            <button
              class="bottom-nav-item"
              [class.active]="activeRoute() === item.id"
              (click)="nav(item.route)"
            >
              <span class="bottom-nav-icon">{{ item.icon }}</span>
              <span class="bottom-nav-label">{{ item.label }}</span>
            </button>
          }
        </nav>
      </div>
    }
  `,
  styles: [`:host { display: block; }`],
})
export class AppComponent implements OnInit {
  navItems = NAV_ITEMS;
  activeRoute = signal('home');
  isAuthPage = signal(false);
  sidebarStreak = signal(0);

  readonly today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  constructor(public auth: AuthService, private router: Router, private api: DiaryApiService) {
    const path = window.location.pathname;
    const onAuthRoute = AUTH_ROUTES.some(r => path.startsWith(r));
    this.isAuthPage.set(onAuthRoute || !auth.getToken());
  }

  ngOnInit() {
    this.auth.loadCurrentUser();

    this.api.getStreak().subscribe({
      next: s => this.sidebarStreak.set(s.streak),
      error: () => {},
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.isAuthPage.set(AUTH_ROUTES.some(r => url.startsWith(r)));
      if (url === '/' || url === '')          this.activeRoute.set('home');
      else if (url.startsWith('/compose'))    this.activeRoute.set('compose');
      else if (url.startsWith('/generating')) this.activeRoute.set('compose');
      else if (url.startsWith('/pages'))      this.activeRoute.set('pages');
      else if (url.startsWith('/history'))    this.activeRoute.set('pages');
      else if (url.startsWith('/library'))    this.activeRoute.set('pages');
      else if (url.startsWith('/reflect'))    this.activeRoute.set('reflect');
      else if (url.startsWith('/chat'))       this.activeRoute.set('chat');
      else if (url.startsWith('/settings'))   this.activeRoute.set('settings');
      else if (url.startsWith('/entry'))      this.activeRoute.set('pages');
      else if (url.startsWith('/shared'))     this.activeRoute.set('');
    });
  }

  crumb(): string {
    const map: Record<string, string> = {
      home: 'Today', compose: 'Pour', pages: 'Pages',
      reflect: 'Weave', chat: 'Commune', settings: 'Sanctum',
    };
    return map[this.activeRoute()] ?? '';
  }

  nav(route: string) { this.router.navigate([route]); }

  // Sun=0 Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6
  private static readonly DAY_ORBS = [
    { hue: 190, warmth: 0.52 }, // Sunday
    { hue: 56,  warmth: 0.72 }, // Monday
    { hue: 28,  warmth: 0.78 }, // Tuesday
    { hue: 130, warmth: 0.58 }, // Wednesday
    { hue: 280, warmth: 0.52 }, // Thursday
    { hue: 42,  warmth: 0.82 }, // Friday
    { hue: 340, warmth: 0.62 }, // Saturday
  ];

  get dayOrb() { return AppComponent.DAY_ORBS[new Date().getDay()]; }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.isAuthPage()) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (e.key === 'h' || e.key === 'H') this.nav('/');
    if (e.key === 'w' || e.key === 'W') this.nav('/compose');
    if (e.key === 'j' || e.key === 'J') this.nav('/pages');
    if (e.key === 'r' || e.key === 'R') this.nav('/reflect');
    if (e.key === 'c' || e.key === 'C') this.nav('/chat');
    if (e.key === 's' || e.key === 'S') this.nav('/settings');
    if (e.key === 'Escape') this.nav('/');
  }
}
