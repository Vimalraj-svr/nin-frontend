import { Component, HostListener, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { DiaryApiService } from './services/diary-api.service';
import { NotifBellComponent } from './components/notif-bell/notif-bell.component';

interface NavItem { id: string; label: string; sub: string; route: string; k: string; icon: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'home',     label: 'Today',   sub: 'this moment',       route: '/',        k: 'H', icon: '◎' },
  { id: 'compose',  label: 'Pour',    sub: 'new entry',         route: '/compose', k: 'W', icon: '✍' },
  { id: 'pages',    label: 'Pages',   sub: 'your full story',   route: '/pages',   k: 'J', icon: '◷' },
  { id: 'people',   label: 'Kin',     sub: 'follow & share',    route: '/people',  k: 'K', icon: '◐' },
  { id: 'reflect',  label: 'Weave',   sub: 'threads & letters', route: '/reflect', k: 'R', icon: '◈' },
  { id: 'chat',     label: 'Commune', sub: 'ask your diary',    route: '/chat',    k: 'C', icon: '◉' },
  { id: 'settings', label: 'Sanctum', sub: 'your space',        route: '/settings',k: 'S', icon: '⚙' },
];

const AUTH_ROUTES = ['/login', '/register', '/shared', '/forgot-password', '/reset-password'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NotifBellComponent],
  template: `
    @if (isAuthPage()) {
      <!-- Auth pages: full-screen, no sidebar -->
      <router-outlet />
    } @else {
      <div class="emoji-scatter" aria-hidden="true">
        <img src="/assets/svgs/emojis/sparkle.svg"          class="es" style="top:5%;left:2.5%;width:3.25rem;opacity:0.10;transform:rotate(-14deg)" />
        <img src="/assets/svgs/emojis/heart.svg"            class="es" style="top:12%;right:4%;width:3.75rem;opacity:0.09;transform:rotate(18deg)" />
        <img src="/assets/svgs/emojis/flower.svg"           class="es" style="top:28%;left:1%;width:4rem;opacity:0.08;transform:rotate(-7deg)" />
        <img src="/assets/svgs/emojis/happy-smile-1.svg"    class="es" style="top:45%;right:2%;width:3.5rem;opacity:0.08;transform:rotate(22deg)" />
        <img src="/assets/svgs/emojis/moon.svg"             class="es" style="top:60%;left:3%;width:3.25rem;opacity:0.10;transform:rotate(-20deg)" />
        <img src="/assets/svgs/emojis/star-eyes.svg"        class="es" style="top:74%;right:5%;width:3.75rem;opacity:0.08;transform:rotate(10deg)" />
        <img src="/assets/svgs/emojis/sparkle.svg"          class="es" style="top:87%;left:8%;width:3rem;opacity:0.09;transform:rotate(28deg)" />
        <img src="/assets/svgs/emojis/happy-smile-wink.svg" class="es" style="top:21%;right:21%;width:3.5rem;opacity:0.07;transform:rotate(-6deg)" />
        <img src="/assets/svgs/emojis/flower.svg"           class="es" style="top:52%;left:16%;width:3.125rem;opacity:0.07;transform:rotate(16deg)" />
        <img src="/assets/svgs/emojis/heart.svg"            class="es" style="top:91%;right:14%;width:3.125rem;opacity:0.08;transform:rotate(-12deg)" />
        <img src="/assets/svgs/emojis/sun.svg"              class="es" style="top:37%;right:12%;width:3.25rem;opacity:0.07;transform:rotate(8deg)" />
        <img src="/assets/svgs/emojis/music.svg"            class="es" style="top:68%;left:26%;width:3rem;opacity:0.07;transform:rotate(-22deg)" />
        <img src="/assets/svgs/emojis/thinking.svg"         class="es" style="top:15%;left:41%;width:3rem;opacity:0.06;transform:rotate(5deg)" />
        <img src="/assets/svgs/emojis/kiss-emoji.svg"       class="es" style="top:43%;left:37%;width:3.125rem;opacity:0.06;transform:rotate(-18deg)" />
        <img src="/assets/svgs/emojis/happy-smile-2.svg"    class="es" style="top:77%;left:47%;width:3.375rem;opacity:0.07;transform:rotate(14deg)" />
        <img src="/assets/svgs/emojis/anxious.svg"          class="es" style="top:32%;right:30%;width:2.875rem;opacity:0.06;transform:rotate(-8deg)" />
        <img src="/assets/svgs/emojis/sun.svg"              class="es" style="top:7%;right:38%;width:3.125rem;opacity:0.06;transform:rotate(-3deg)" />
        <img src="/assets/svgs/emojis/sparkle.svg"          class="es" style="top:95%;left:50%;width:2.875rem;opacity:0.06;transform:rotate(31deg)" />
        <img src="/assets/svgs/emojis/moon.svg"             class="es" style="top:56%;right:37%;width:3.25rem;opacity:0.07;transform:rotate(-16deg)" />
        <img src="/assets/svgs/emojis/sad.svg"              class="es" style="top:82%;right:27%;width:2.875rem;opacity:0.05;transform:rotate(23deg)" />
      </div>
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
            <img class="floral-left" src="/assets/svgs/floral-corner-left.svg" alt="" aria-hidden="true" />
            <div class="crumb">{{ crumb() }}</div>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <app-notif-bell />
              <div class="topbar-divider"></div>
              <div class="date">{{ today }}</div>
            </div>
            <!-- <img class="floral-right" src="/assets/svgs/floral-corner-left.svg" alt="" aria-hidden="true" /> -->
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
      else if (url.startsWith('/people'))     this.activeRoute.set('people');
      else if (url.startsWith('/reflect'))    this.activeRoute.set('reflect');
      else if (url.startsWith('/chat'))       this.activeRoute.set('chat');
      else if (url.startsWith('/settings'))   this.activeRoute.set('settings');
      else if (url.startsWith('/entry'))      this.activeRoute.set('pages');
      else if (url.startsWith('/shared'))     this.activeRoute.set('');
    });
  }

  crumb(): string {
    const map: Record<string, string> = {
      home: 'Today', compose: 'Pour', pages: 'Pages', people: 'Kin',
      reflect: 'Weave', chat: 'Commune', settings: 'Sanctum',
    };
    return map[this.activeRoute()] ?? '';
  }

  nav(route: string) { this.router.navigate([route]); }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.isAuthPage()) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (e.key === 'h' || e.key === 'H') this.nav('/');
    if (e.key === 'w' || e.key === 'W') this.nav('/compose');
    if (e.key === 'j' || e.key === 'J') this.nav('/pages');
    if (e.key === 'k' || e.key === 'K') this.nav('/people');
    if (e.key === 'r' || e.key === 'R') this.nav('/reflect');
    if (e.key === 'c' || e.key === 'C') this.nav('/chat');
    if (e.key === 's' || e.key === 'S') this.nav('/settings');
    if (e.key === 'Escape') this.nav('/');
  }
}
