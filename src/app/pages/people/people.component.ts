import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialApiService } from '../../services/social-api.service';
import { SocialProfile } from '../../models/diary.model';

type PeopleTab = 'discover' | 'following' | 'followers' | 'restricted';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './people.component.html',
  styleUrl: './people.component.css',
})
export class PeopleComponent implements OnInit {
  tab = signal<PeopleTab>('discover');

  searchQuery = '';
  allUsers = signal<SocialProfile[]>([]);
  loadingDiscover = signal(false);

  following = signal<SocialProfile[]>([]);
  followers = signal<SocialProfile[]>([]);
  restricted = signal<SocialProfile[]>([]);

  loadingList = signal(false);
  pendingId = signal<string | null>(null);

  inviteEmail = '';
  inviteResult = signal<{ status: string; name?: string; sent?: boolean } | null>(null);
  inviteSending = false;

  searchResults = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.allUsers();
    return this.allUsers().filter(p => p.name.toLowerCase().includes(q));
  });

  get isEmailQuery(): boolean {
    return this.searchQuery.trim().includes('@');
  }

  get searching(): boolean {
    return false;
  }

  get searchDone(): boolean {
    return !this.loadingDiscover();
  }

  onSearchInput() {}

  constructor(private social: SocialApiService, private router: Router) {}

  ngOnInit() {
    this._loadDiscover();
    this.loadTab('following');
    this.loadTab('followers');
  }

  private _loadDiscover() {
    this.loadingDiscover.set(true);
    this.social.getDiscoverUsers().subscribe({
      next: list => { this.allUsers.set(list); this.loadingDiscover.set(false); },
      error: () => this.loadingDiscover.set(false),
    });
  }

  setTab(t: PeopleTab) {
    this.tab.set(t);
    if (t === 'restricted' && this.restricted().length === 0) {
      this.loadTab('restricted');
    }
  }

  checkInvite() {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.inviteSending = true;
    this.inviteResult.set(null);
    this.social.inviteFriend(email).subscribe({
      next: result => { this.inviteResult.set(result); this.inviteSending = false; },
      error: () => { this.inviteSending = false; },
    });
  }

  private loadTab(t: 'following' | 'followers' | 'restricted') {
    this.loadingList.set(true);
    const obs = t === 'following' ? this.social.getFollowing()
              : t === 'followers' ? this.social.getFollowers()
              : this.social.getRestricted();
    obs.subscribe({
      next: list => {
        if (t === 'following') this.following.set(list);
        else if (t === 'followers') this.followers.set(list);
        else this.restricted.set(list);
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false),
    });
  }

  openProfile(id: string) {
    this.router.navigate(['/people', id]);
  }

  follow(profile: SocialProfile) {
    this.pendingId.set(profile.id);
    this.social.followUser(profile.id).subscribe({
      next: () => {
        this._updateProfile(profile.id, { is_following: true });
        this.pendingId.set(null);
        this.loadTab('following');
      },
      error: () => this.pendingId.set(null),
    });
  }

  unfollow(profile: SocialProfile) {
    this.pendingId.set(profile.id);
    this.social.unfollowUser(profile.id).subscribe({
      next: () => {
        this._updateProfile(profile.id, { is_following: false });
        this.following.update(list => list.filter(p => p.id !== profile.id));
        this.pendingId.set(null);
      },
      error: () => this.pendingId.set(null),
    });
  }

  restrict(profile: SocialProfile) {
    this.pendingId.set(profile.id);
    this.social.restrictUser(profile.id).subscribe({
      next: () => {
        this._updateProfile(profile.id, { is_restricted: true, is_following: false });
        this.following.update(list => list.filter(p => p.id !== profile.id));
        this.followers.update(list => list.filter(p => p.id !== profile.id));
        this.restricted.update(list => [...list, { ...profile, is_restricted: true, is_following: false }]);
        this.allUsers.update(list => list.filter(p => p.id !== profile.id));
        this.pendingId.set(null);
      },
      error: () => this.pendingId.set(null),
    });
  }

  unrestrict(profile: SocialProfile) {
    this.pendingId.set(profile.id);
    this.social.unrestrictUser(profile.id).subscribe({
      next: () => {
        this.restricted.update(list => list.filter(p => p.id !== profile.id));
        this._updateProfile(profile.id, { is_restricted: false });
        this.pendingId.set(null);
      },
      error: () => this.pendingId.set(null),
    });
  }

  private _updateProfile(id: string, patch: Partial<SocialProfile>) {
    const update = (list: SocialProfile[]) =>
      list.map(p => p.id === id ? { ...p, ...patch } : p);
    this.allUsers.update(update);
    this.following.update(update);
    this.followers.update(update);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
