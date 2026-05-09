import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'compose',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/compose/compose.component').then(m => m.ComposeComponent),
  },
  {
    path: 'generating',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/generating/generating.component').then(m => m.GeneratingComponent),
  },
  {
    path: 'pages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'people',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/people/people.component').then(m => m.PeopleComponent),
  },
  {
    path: 'people/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/people/profile/profile.component').then(m => m.ProfileComponent),
  },
  { path: 'history', redirectTo: '/pages', pathMatch: 'full' },
  { path: 'library', redirectTo: '/pages', pathMatch: 'full' },
  {
    path: 'entry/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/entry-detail/entry-detail.component').then(m => m.EntryDetailComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'reflect',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reflect/reflect.component').then(m => m.ReflectComponent),
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'shared/:token',
    loadComponent: () =>
      import('./pages/shared/shared.component').then(m => m.SharedComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.component').then(m => m.AboutComponent),
  },
  { path: '**', redirectTo: '' },
];
