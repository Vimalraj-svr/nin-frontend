import { Component, EventEmitter, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialApiService } from '../../services/social-api.service';
import { SocialProfile } from '../../models/diary.model';

@Component({
  selector: 'app-share-with-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './share-with-modal.component.html',
  styleUrl: './share-with-modal.component.css',
})
export class ShareWithModalComponent implements OnChanges, OnInit {
  @Input() entryId!: string;
  @Input() sharedWith: string[] = [];
  @Output() close = new EventEmitter<string[]>();

  searchQuery = '';
  searchResults = signal<SocialProfile[]>([]);
  searching = false;
  searchDone = false;
  currentShared = signal<{ id: string; name: string }[]>([]);
  pendingId = signal<string | null>(null);
  error = '';

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(private social: SocialApiService) {}

  ngOnInit() {
    this._loadSharedNames();
  }

  ngOnChanges() {
    this._loadSharedNames();
  }

  private _loadSharedNames() {
    if (!this.sharedWith.length) { this.currentShared.set([]); return; }
    this.currentShared.set(this.sharedWith.map(id => ({ id, name: '…' })));
    this.social.getUsersInfo(this.sharedWith).subscribe({
      next: infos => {
        const nameMap = new Map(infos.map(u => [u.id, u.name]));
        this.currentShared.set(
          this.sharedWith.map(id => ({ id, name: nameMap.get(id) ?? '…' }))
        );
      },
    });
  }

  onSearchInput() {
    clearTimeout(this.searchTimer);
    const q = this.searchQuery.trim();
    if (!q) { this.searchResults.set([]); this.searchDone = false; return; }
    this.searchTimer = setTimeout(() => this.runSearch(q), 350);
  }

  private runSearch(q: string) {
    this.searching = true;
    this.searchDone = false;
    this.social.searchUsers(q).subscribe({
      next: results => {
        this.searchResults.set(results);
        this.searching = false;
        this.searchDone = true;
        // Update names for already-shared users we found
        this.currentShared.update(list =>
          list.map(s => {
            const found = results.find(r => r.id === s.id);
            return found ? { ...s, name: found.name } : s;
          })
        );
      },
      error: () => { this.searching = false; this.searchDone = true; },
    });
  }

  isShared(userId: string): boolean {
    return this.currentShared().some(s => s.id === userId);
  }

  addUser(profile: SocialProfile) {
    if (this.isShared(profile.id)) return;
    this.pendingId.set(profile.id);
    this.error = '';
    this.social.shareEntryWith(this.entryId, profile.id).subscribe({
      next: () => {
        this.currentShared.update(list => [...list, { id: profile.id, name: profile.name }]);
        this.pendingId.set(null);
      },
      error: (err) => {
        this.error = err?.error?.detail ?? 'Could not share. Try again.';
        this.pendingId.set(null);
      },
    });
  }

  removeUser(shared: { id: string; name: string }) {
    this.pendingId.set(shared.id);
    this.error = '';
    this.social.unshareEntryWith(this.entryId, shared.id).subscribe({
      next: () => {
        this.currentShared.update(list => list.filter(s => s.id !== shared.id));
        this.pendingId.set(null);
      },
      error: () => this.pendingId.set(null),
    });
  }

  dismiss() {
    this.close.emit(this.currentShared().map(s => s.id));
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
