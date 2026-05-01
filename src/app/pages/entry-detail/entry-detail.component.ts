import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrbComponent } from '../../components/orb/orb.component';
import { ShareWithModalComponent } from '../../components/share-with-modal/share-with-modal.component';
import { DiaryApiService, SAMPLE_ENTRIES, SampleEntry, moodFromSummary, MoodInfo } from '../../services/diary-api.service';
import { DiaryEntry, EmotionFlag, EMOTION_FLAGS, EntryComment, ImageAsset } from '../../models/diary.model';
import { EMOJI_CATEGORIES, EmojiCategory, ALL_EMOJIS } from '../../data/emojis';
import { AuthService } from '../../services/auth.service';
import { shouldShowLocalizedCompanion, uiLanguageForPreference } from '../../utils/ui-language';

const GENERATED_BILINGUAL = [
  '"Inniki romba tough day-a start aanadhu." The day began heavy. Even though I knew the 9 a.m. meeting was coming, last night sariya thoongala — sleep had stayed just out of reach. In the meeting, my boss kept interrupting while I was explaining the migration plan. Vaya thirakka mudiyala. The throat would not open.',
  'Veettuku vandhu, made filter coffee, sat in the balcony. Mazhai start aachu. Slowly, the mind also started settling down. Meera called, and we laughed about something small — the way we always do.',
  'Maybe inniki kaalaiya mattum vechu naala alakka koodadhu. Perhaps the morning was not the whole day. This, I think, is what evenings are for.',
];


export const EMOTION_FLAG_MAP = new Map(EMOTION_FLAGS.map(f => [f.value, f]));

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [OrbComponent, FormsModule, ShareWithModalComponent],
  templateUrl: './entry-detail.component.html',
  styleUrl: './entry-detail.component.css',
})
export class EntryDetailComponent implements OnInit, OnDestroy {
  private routeSub?: Subscription;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('commentInput') commentInput!: ElementRef<HTMLTextAreaElement>;

  sampleEntry: SampleEntry | null = null;
  apiEntry = signal<DiaryEntry | null>(null);
  loading = true;
  notFound = false;
  isNew = false;

  // UI states
  editMode = false;
  editText = '';
  editTitle = '';
  editSaving = false;

  showEmojiPicker = false;
  emojiSearch = '';
  activeCategoryId = 'smileys';
  entryEmojis = signal<string[]>([]);

  images = signal<ImageAsset[]>([]);
  uploadingImage = false;
  readonly imageUploadEnabled = false; // Cloudinary not configured yet

  comments = signal<EntryComment[]>([]);
  newComment = '';
  addingComment = false;

  emotionFlag = signal<EmotionFlag | null>(null);
  isHidden = signal(false);

  deleteConfirm = false;
  shareLink = '';
  shareCopied = false;

  showShareModal = false;
  sharedWith = signal<string[]>([]);
  viewerIsOwner = signal(true);

  readonly emotionFlags = EMOTION_FLAGS;
  readonly emojiCategories = EMOJI_CATEGORIES;

  get activeEmojiCategory(): EmojiCategory {
    return this.emojiCategories.find(c => c.id === this.activeCategoryId) ?? this.emojiCategories[0];
  }

  get filteredEmojis(): string[] {
    const q = this.emojiSearch.trim().toLowerCase();
    if (!q) return this.activeEmojiCategory.emojis;
    return ALL_EMOJIS.filter(e => e.includes(q));
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: DiaryApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) { this.loading = false; return; }

      if (id === 'new') { this.isNew = true; this.loading = false; return; }

      const sample = SAMPLE_ENTRIES.find(e => e.id === id);
      if (sample) { this.sampleEntry = sample; this.loading = false; return; }

      this.loading = true;
      this.notFound = false;
      this.editMode = false;
      this.apiEntry.set(null);

      this.api.getEntry(id).subscribe({
        next: e => {
          this.apiEntry.set(e);
          this.entryEmojis.set(e.emojis ?? []);
          this.images.set(e.images ?? []);
          this.comments.set(e.comments ?? []);
          this.emotionFlag.set(e.emotion_flag ?? null);
          this.isHidden.set(e.is_hidden ?? false);
          this.sharedWith.set(e.shared_with ?? []);
          this.viewerIsOwner.set(e.viewer_is_owner ?? true);
          this.editText = e.content_edit ?? e.content_original ?? e.content_english ?? '';
          this.editTitle = e.title_edit ?? e.title_original ?? e.title_english ?? '';
          this.loading = false;
        },
        error: () => { this.loading = false; this.notFound = true; },
      });
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  // ── display getters ──────────────────────────────────────────────────────────

  get mood(): MoodInfo {
    if (this.sampleEntry) return this.sampleEntry.mood;
    if (this.apiEntry()) return moodFromSummary(this.apiEntry()!.mood_summary);
    return { hue: 260, warmth: 0.38, label: 'Heavy', primary: 'heavy' };
  }

  get title(): string {
    if (this.sampleEntry) return this.sampleEntry.title;
    if (this.apiEntry()) return this.apiEntry()!.title_edit ?? this.apiEntry()!.title_original ?? this.apiEntry()!.title_english ?? 'Untitled';
    return 'Vaya thirakka mudiyala — The throat would not open';
  }

  get titleEnglish(): string {
    const e = this.apiEntry();
    if (e && e.title_original && e.title_english) return e.title_english;
    return '';
  }

  get tamSub(): string {
    if (this.sampleEntry) return '';
    const e = this.apiEntry();
    if (e) return e.title_english && e.title_original ? e.title_original : '';
    return 'வாய் திறக்க முடியவில்லை';
  }

  get bodyParas(): string[] {
    if (this.sampleEntry) return [this.sampleEntry.raw];
    const e = this.apiEntry();
    if (e) {
      const text = e.content_edit ?? e.content_original ?? e.content_english ?? '';
      return text.split(/\n\n+/).filter(Boolean);
    }
    return GENERATED_BILINGUAL;
  }

  get englishParas(): string[] {
    const e = this.apiEntry();
    if (!e?.content_english || !e?.content_original || e.content_edit) return [];
    return e.content_english.split(/\n\n+/).filter(Boolean);
  }

  get dateNum(): number {
    if (this.sampleEntry) return parseInt(this.sampleEntry.date.split('-')[2], 10);
    if (this.apiEntry()) return new Date(this.apiEntry()!.created_at).getDate();
    return 19;
  }

  get dateLabel(): string {
    if (this.sampleEntry) return `APR · ${this.sampleEntry.dayLabel.toUpperCase()}`;
    if (this.apiEntry()) {
      const d = new Date(this.apiEntry()!.created_at);
      return d.toLocaleDateString('en-GB', { month: 'short', weekday: 'long' }).toUpperCase();
    }
    return 'APR · SUNDAY';
  }

  get subhead(): string {
    if (this.sampleEntry) return `${this.sampleEntry.style} · ${this.sampleEntry.language} · ${this.sampleEntry.timeLabel}`;
    const e = this.apiEntry();
    if (e) {
      const modeLabels: Record<string, string> = {
        SAME_LANGUAGE: 'Same language', ENGLISH_REFINED: 'English refined', BILINGUAL: 'Bilingual',
      };
      const langLabels: Record<string, string> = {
        ta: 'Tamil', en: 'English', hi: 'Hindi', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam',
      };
      const mode = modeLabels[e.output_mode ?? ''] ?? e.output_mode ?? '';
      const lang = langLabels[e.detected_language ?? ''] ?? (e.detected_language ?? '');
      const time = this.formatTime(e.created_at);
      return `${mode} · ${lang} · ${time}`;
    }
    return 'Bilingual · Tanglish → English · 10:47 am';
  }

  get currentEmotionInfo() {
    const flag = this.emotionFlag();
    return flag ? EMOTION_FLAG_MAP.get(flag) ?? null : null;
  }

  // ── edit ─────────────────────────────────────────────────────────────────────

  startEdit() {
    const e = this.apiEntry();
    if (!e) return;
    this.editText = e.content_edit ?? e.content_original ?? e.content_english ?? '';
    this.editTitle = e.title_edit ?? e.title_original ?? e.title_english ?? '';
    this.editMode = true;
    this.showEmojiPicker = false;
  }

  cancelEdit() { this.editMode = false; }

  saveEdit() {
    const e = this.apiEntry();
    if (!e || this.editSaving) return;
    this.editSaving = true;
    this.api.patchEntry(e.id, {
      content_edit: this.editText,
      title_edit: this.editTitle.trim() || null,
    }).subscribe({
      next: updated => {
        this.apiEntry.set(updated);
        this.editMode = false;
        this.editSaving = false;
      },
      error: () => { this.editSaving = false; },
    });
  }

  // ── emojis ───────────────────────────────────────────────────────────────────

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) { this.emojiSearch = ''; this.activeCategoryId = 'smileys'; }
  }

  addEmoji(emoji: string) {
    const e = this.apiEntry();
    if (!e) return;
    const updated = [...this.entryEmojis(), emoji];
    this.entryEmojis.set(updated);
    this.api.patchEntry(e.id, { emojis: updated }).subscribe();
  }

  removeEmoji(i: number) {
    const e = this.apiEntry();
    if (!e) return;
    const updated = this.entryEmojis().filter((_, idx) => idx !== i);
    this.entryEmojis.set(updated);
    this.api.patchEntry(e.id, { emojis: updated }).subscribe();
  }

  // ── images ───────────────────────────────────────────────────────────────────

  openImagePicker() { this.imageInput.nativeElement.click(); }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.apiEntry()) return;
    this.uploadingImage = true;
    this.api.uploadImage(this.apiEntry()!.id, file).subscribe({
      next: asset => {
        this.images.set([...this.images(), asset]);
        this.uploadingImage = false;
      },
      error: () => { this.uploadingImage = false; },
    });
    input.value = '';
  }

  deleteImage(asset: ImageAsset) {
    const e = this.apiEntry();
    if (!e) return;
    this.api.deleteImage(e.id, asset.public_id).subscribe({
      next: () => this.images.set(this.images().filter(a => a.public_id !== asset.public_id)),
      error: () => {},
    });
  }

  // ── emotion flag ─────────────────────────────────────────────────────────────

  setEmotion(flag: EmotionFlag) {
    const e = this.apiEntry();
    if (!e) return;
    const next = this.emotionFlag() === flag ? null : flag;
    this.emotionFlag.set(next);
    this.api.patchEntry(e.id, { emotion_flag: next }).subscribe();
  }

  // ── hide ─────────────────────────────────────────────────────────────────────

  toggleHide() {
    const e = this.apiEntry();
    if (!e) return;
    const next = !this.isHidden();
    this.isHidden.set(next);
    this.api.patchEntry(e.id, { is_hidden: next }).subscribe();
  }

  // ── comments ─────────────────────────────────────────────────────────────────

  submitComment() {
    const e = this.apiEntry();
    if (!e || !this.newComment.trim() || this.addingComment) return;
    this.addingComment = true;
    this.api.addComment(e.id, this.newComment.trim()).subscribe({
      next: c => {
        this.comments.set([...this.comments(), c]);
        this.newComment = '';
        this.addingComment = false;
      },
      error: () => { this.addingComment = false; },
    });
  }

  removeComment(commentId: string) {
    const e = this.apiEntry();
    if (!e) return;
    this.api.deleteComment(e.id, commentId).subscribe({
      next: () => this.comments.set(this.comments().filter(c => c.id !== commentId)),
      error: () => {},
    });
  }

  commentDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // ── share-with people ────────────────────────────────────────────────────────

  openShareModal() { this.showShareModal = true; }

  onShareModalClose(updatedIds: string[]) {
    this.sharedWith.set(updatedIds);
    this.showShareModal = false;
  }

  // ── share link / delete ──────────────────────────────────────────────────────

  shareEntry() {
    const e = this.apiEntry();
    if (!e) return;
    this.api.createShareLink(e.id).subscribe({
      next: r => {
        this.shareLink = `${window.location.origin}/shared/${r.token}`;
        navigator.clipboard.writeText(this.shareLink).then(() => {
          this.shareCopied = true;
          setTimeout(() => this.shareCopied = false, 3000);
        });
      },
      error: () => {},
    });
  }

  confirmDelete() { this.deleteConfirm = true; }
  cancelDelete() { this.deleteConfirm = false; }

  deleteEntry() {
    const e = this.apiEntry();
    if (!e) return;
    this.api.deleteEntry(e.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {},
    });
  }

  // ── nav ──────────────────────────────────────────────────────────────────────

  back() { this.router.navigate(['/']); }

  dropChar(para: string): string {
    const t = para.trim();
    return t.charAt(0) === '"' ? t.charAt(1) : t.charAt(0);
  }

  restOfPara(para: string): string {
    const t = para.trim();
    return t.charAt(0) === '"' ? '"' + t.slice(2) : t.slice(1);
  }

  private formatTime(d: string) {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
