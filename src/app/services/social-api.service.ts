import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DiaryEntry, SocialProfile } from '../models/diary.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocialApiService {
  private readonly base = `${environment.apiUrl}/social`;
  private readonly entriesBase = `${environment.apiUrl}/entries`;

  constructor(private http: HttpClient) {}

  getUsersInfo(ids: string[]): Observable<{ id: string; name: string }[]> {
    if (!ids.length) return of([]);
    const params = new HttpParams().set('ids', ids.join(','));
    return this.http.get<{ id: string; name: string }[]>(`${this.base}/users-info`, { params });
  }

  getDiscoverUsers(): Observable<SocialProfile[]> {
    return this.http.get<SocialProfile[]>(`${this.base}/discover`);
  }

  searchUsers(q: string): Observable<SocialProfile[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<SocialProfile[]>(`${this.base}/search`, { params });
  }

  getProfile(userId: string): Observable<SocialProfile> {
    return this.http.get<SocialProfile>(`${this.base}/profile/${userId}`);
  }

  followUser(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/follow/${userId}`, {});
  }

  unfollowUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/follow/${userId}`);
  }

  restrictUser(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/restrict/${userId}`, {});
  }

  unrestrictUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/restrict/${userId}`);
  }

  getFollowers(): Observable<SocialProfile[]> {
    return this.http.get<SocialProfile[]>(`${this.base}/followers`);
  }

  getFollowing(): Observable<SocialProfile[]> {
    return this.http.get<SocialProfile[]>(`${this.base}/following`);
  }

  getRestricted(): Observable<SocialProfile[]> {
    return this.http.get<SocialProfile[]>(`${this.base}/restricted`);
  }

  shareEntryWith(entryId: string, userId: string): Observable<{ message: string; shared_with_name: string }> {
    return this.http.post<{ message: string; shared_with_name: string }>(
      `${this.entriesBase}/${entryId}/share-with`,
      { user_id: userId },
    );
  }

  unshareEntryWith(entryId: string, userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.entriesBase}/${entryId}/share-with/${userId}`,
    );
  }

  getSharedWithMe(): Observable<(DiaryEntry & { shared_by_name: string })[]> {
    return this.http.get<(DiaryEntry & { shared_by_name: string })[]>(
      `${this.entriesBase}/shared-with-me`,
    );
  }

  getSharedWithMeFrom(userId: string): Observable<(DiaryEntry & { shared_by_name: string })[]> {
    return this.http.get<(DiaryEntry & { shared_by_name: string })[]>(
      `${this.entriesBase}/shared-with-me`,
      { params: { from_user_id: userId } },
    );
  }

  getNotifications(): Observable<{ unread: number; notifications: AppNotification[] }> {
    return this.http.get<{ unread: number; notifications: AppNotification[] }>(`${this.base}/notifications`);
  }

  markAllRead(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/notifications/read-all`, {});
  }

  markOneRead(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/notifications/${id}/read`, {});
  }

  inviteFriend(email: string): Observable<{ status: string; name?: string; sent?: boolean }> {
    return this.http.post<{ status: string; name?: string; sent?: boolean }>(`${this.base}/invite`, { email });
  }

  getVibeCheckStatus(userId: string): Observable<VibeCheckStatus> {
    return this.http.get<VibeCheckStatus>(`${this.base}/vibe-check/${userId}`);
  }

  runVibeCheck(userId: string): Observable<VibeCheckResult & { remaining: number; cached: boolean }> {
    return this.http.post<VibeCheckResult & { remaining: number; cached: boolean }>(`${this.base}/vibe-check/${userId}`, {});
  }
}

export interface VibeCheckResult {
  score: number;
  label: string;
  description: string;
  traits_a: string[];
  traits_b: string[];
  my_vibe_hue: number;
  their_vibe_hue: number;
}

export interface VibeCheckStatus {
  remaining: number;
  result: VibeCheckResult | null;
}

export interface AppNotification {
  id: string;
  type: 'new_follower' | 'shared_memory';
  actor_name: string;
  actor_id?: string;
  entry_id?: string;
  read: boolean;
  created_at: string;
}
