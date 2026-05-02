import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocialApiService, VibeCheckResult, VibeCheckStatus } from '../../../services/social-api.service';
import { SocialProfile, DiaryEntry, LANGUAGE_DISPLAY } from '../../../models/diary.model';
import { MoodEmojiComponent } from '../../../components/mood-emoji/mood-emoji.component';
import { moodFromSummary } from '../../../services/diary-api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MoodEmojiComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profile = signal<SocialProfile | null>(null);
  loading = signal(true);

  vibeRemaining = signal(3);
  vibeResult = signal<VibeCheckResult | null>(null);
  vibeLoading = signal(false);
  vibeError = signal('');

  pendingAction = signal('');
  sharedEntries = signal<(DiaryEntry & { shared_by_name: string })[]>([]);
  sharedByMe = signal<DiaryEntry[]>([]);

  private userId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private social: SocialApiService,
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.userId) { this.router.navigate(['/people']); return; }
    this.loadProfile();
    this.loadVibeStatus();
    this.loadSharedEntries();
    this.loadSharedByMe();
  }

  private loadProfile() {
    this.loading.set(true);
    this.social.getProfile(this.userId).subscribe({
      next: p => { this.profile.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/people']); },
    });
  }

  private loadSharedEntries() {
    this.social.getSharedWithMeFrom(this.userId).subscribe({
      next: entries => this.sharedEntries.set(entries),
      error: () => {},
    });
  }

  private loadSharedByMe() {
    this.social.getSharedByMeWith(this.userId).subscribe({
      next: entries => this.sharedByMe.set(entries),
      error: () => {},
    });
  }

  moodPrimary(entry: DiaryEntry): string {
    return moodFromSummary(entry.mood_summary).primary;
  }

  private loadVibeStatus() {
    this.social.getVibeCheckStatus(this.userId).subscribe({
      next: (s: VibeCheckStatus) => {
        this.vibeRemaining.set(s.remaining);
        this.vibeResult.set(s.result);
      },
    });
  }

  runVibeCheck() {
    this.vibeLoading.set(true);
    this.vibeError.set('');
    this.social.runVibeCheck(this.userId).subscribe({
      next: res => {
        this.vibeResult.set({
          score: res.score,
          label: res.label,
          description: res.description,
          traits_a: res.traits_a ?? [],
          traits_b: res.traits_b ?? [],
          my_vibe_hue: res.my_vibe_hue,
          their_vibe_hue: res.their_vibe_hue,
        });
        this.vibeRemaining.set(res.remaining);
        this.vibeLoading.set(false);
      },
      error: err => {
        this.vibeError.set(err?.error?.detail ?? 'Could not run vibe check right now.');
        this.vibeLoading.set(false);
      },
    });
  }

  scoreArcOffset = computed(() => {
    const score = this.vibeResult()?.score ?? 0;
    const circumference = 2 * Math.PI * 42;
    return circumference - (score / 100) * circumference;
  });

  follow() {
    const p = this.profile(); if (!p) return;
    this.pendingAction.set('follow');
    this.social.followUser(p.id).subscribe({
      next: () => { this.profile.update(pr => pr ? { ...pr, is_following: true } : pr); this.pendingAction.set(''); },
      error: () => this.pendingAction.set(''),
    });
  }

  unfollow() {
    const p = this.profile(); if (!p) return;
    this.pendingAction.set('unfollow');
    this.social.unfollowUser(p.id).subscribe({
      next: () => { this.profile.update(pr => pr ? { ...pr, is_following: false } : pr); this.pendingAction.set(''); },
      error: () => this.pendingAction.set(''),
    });
  }

  restrict() {
    const p = this.profile(); if (!p) return;
    this.pendingAction.set('restrict');
    this.social.restrictUser(p.id).subscribe({
      next: () => {
        this.profile.update(pr => pr ? { ...pr, is_restricted: true, is_following: false } : pr);
        this.pendingAction.set('');
      },
      error: () => this.pendingAction.set(''),
    });
  }

  unrestrict() {
    const p = this.profile(); if (!p) return;
    this.pendingAction.set('unrestrict');
    this.social.unrestrictUser(p.id).subscribe({
      next: () => { this.profile.update(pr => pr ? { ...pr, is_restricted: false } : pr); this.pendingAction.set(''); },
      error: () => this.pendingAction.set(''),
    });
  }

  avatarStyle(): string {
    const hue = this.profile()?.vibe_hue ?? 56;
    return `background: oklch(0.88 0.08 ${hue}); color: oklch(0.38 0.14 ${hue});`;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  entryTitle(e: DiaryEntry): string {
    return e.title_original ?? e.title_english ?? 'Untitled';
  }

  entryPreview(e: DiaryEntry): string {
    const t = e.content_original ?? e.content_english ?? e.transcript ?? '';
    const clean = t.replace(/\n+/g, ' ').trim();
    return clean.length > 160 ? clean.slice(0, 160) + '…' : clean;
  }

  entryDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  entryLang(e: DiaryEntry): string {
    const key = e.detected_language ?? e.preferred_language ?? '';
    return LANGUAGE_DISPLAY[key]?.label ?? '';
  }

  openEntry(id: string) { this.router.navigate(['/entry', id]); }

  goBack() { this.router.navigate(['/people']); }
}
