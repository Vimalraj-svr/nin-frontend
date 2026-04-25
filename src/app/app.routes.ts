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
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'library',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/library/library.component').then(m => m.LibraryComponent),
  },
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
  { path: '**', redirectTo: '' },
];
