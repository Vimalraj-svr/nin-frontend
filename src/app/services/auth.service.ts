import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { normalizePreferredLanguage } from '../utils/ui-language';
import { environment } from '../../environments/environment';

export interface PersonalDetails {
  favourites?: string;
  hobbies?: string;
  close_friends?: string;
  music?: string;
  sports?: string;
  destinations?: string;
  extra?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  name_native?: string;
  email: string;
  preferred_language: string;
  gender: string;
  birthday?: string;
  reminder_enabled: boolean;
  reminder_time: string;
  personal_details?: PersonalDetails;
  onboarding_complete: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'nin.token';

  private _isAuth = new BehaviorSubject<boolean>(this.hasToken());
  private _user = new BehaviorSubject<UserProfile | null>(null);

  isAuthenticated$ = this._isAuth.asObservable();
  user$ = this._user.asObservable();

  constructor() {
    if (this.hasToken()) this.loadCurrentUser();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    preferred_language?: string;
    gender?: string;
    birthday?: string;
  }): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}/register`, data);
  }

  login(email: string, password: string): Observable<{ access_token: string; token_type: string }> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    return this.http.post<{ access_token: string; token_type: string }>(
      `${this.apiUrl}/login`,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        this._isAuth.next(true);
        this.loadCurrentUser();
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._isAuth.next(false);
    this._user.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get currentUser(): UserProfile | null {
    return this._user.getValue();
  }

  private normalizeUser(u: UserProfile | null): UserProfile | null {
    if (!u) return null;
    return {
      ...u,
      preferred_language: normalizePreferredLanguage(u.preferred_language),
      gender: u.gender ?? 'prefer_not_to_say',
      reminder_enabled: u.reminder_enabled ?? false,
      reminder_time: u.reminder_time ?? '08:00',
      onboarding_complete: u.onboarding_complete ?? false,
    };
  }

  loadCurrentUser(): void {
    this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      catchError(() => of(null))
    ).subscribe(u => this._user.next(this.normalizeUser(u)));
  }

  updateProfile(data: Partial<{
    name: string;
    preferred_language: string;
    gender: string;
    birthday: string;
    reminder_enabled: boolean;
    reminder_time: string;
    personal_details: PersonalDetails;
    onboarding_complete: boolean;
  }>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me`, data).pipe(
      tap(u => this._user.next(this.normalizeUser(u)))
    );
  }

  getBirthdayWish(): Observable<{ wish: string | null }> {
    return this.http.get<{ wish: string | null }>(`${this.apiUrl}/birthday-wish`);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me`).pipe(
      tap(() => {
        localStorage.removeItem(this.TOKEN_KEY);
        this._isAuth.next(false);
        this._user.next(null);
      })
    );
  }
}
