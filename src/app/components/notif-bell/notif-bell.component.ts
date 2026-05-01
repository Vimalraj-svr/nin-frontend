import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AppNotification } from '../../services/social-api.service';
import { FirebaseService, FBNotification } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notif-bell',
  standalone: true,
  templateUrl: './notif-bell.component.html',
  styleUrl: './notif-bell.component.css',
})
export class NotifBellComponent implements OnInit, OnDestroy {
  unread = signal(0);
  notifications = signal<AppNotification[]>([]);
  open = signal(false);

  private userSub?: Subscription;
  private userId = '';

  constructor(
    private firebase: FirebaseService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.userSub = this.auth.user$
      .pipe(filter(u => !!u?.id), take(1))
      .subscribe(user => {
        this.userId = user!.id;
        this.firebase.connect(this.userId, (items: FBNotification[]) => {
          const mapped: AppNotification[] = items.map(n => ({
            id: n.id,
            type: n.type,
            actor_name: n.actor_name,
            actor_id: n.actor_id,
            entry_id: n.entry_id,
            read: n.read,
            created_at: this.firebase.createdAt(n),
          }));
          this.notifications.set(mapped);
          this.unread.set(mapped.filter(n => !n.read).length);
        });
      });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.firebase.disconnect();
  }

  toggle() {
    this.open.update(v => !v);
    if (this.open() && this.unread() > 0) {
      this.markAll();
    }
  }

  markAll() {
    if (this.userId) {
      this.firebase.markAllRead(this.userId);
    }
    this.unread.set(0);
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.notif-bell-wrap')) {
      this.open.set(false);
    }
  }

  openEntry(entryId: string | undefined) {
    if (entryId) this.router.navigate(['/entry', entryId]);
    this.open.set(false);
  }

  goToProfile(actorId: string) {
    this.router.navigate(['/people', actorId]);
    this.open.set(false);
  }

  label(n: AppNotification): string {
    if (n.type === 'new_follower') return `${n.actor_name} started following you`;
    if (n.type === 'shared_memory') return `${n.actor_name} shared a memory with you`;
    return 'New notification';
  }

  timeAgo(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
