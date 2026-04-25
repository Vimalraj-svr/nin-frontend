import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DiaryApiService } from '../../services/diary-api.service';
import { AuthService } from '../../services/auth.service';
import { firstName } from '../../utils/personalize';

interface MemoryThread { theme: string; observation: string; icon: string; }

@Component({
  selector: 'app-reflect',
  standalone: true,
  imports: [],
  templateUrl: './reflect.component.html',
  styleUrl: './reflect.component.css',
})
export class ReflectComponent implements OnInit {
  streak = signal<number>(0);
  totalEntries = signal<number>(0);
  nextMilestone = signal<number | null>(null);
  entriesToNext = signal<number | null>(null);
  lastMilestone = signal<number | null>(null);

  weeklyLetter = signal<string | null>(null);
  letterLoading = signal(false);
  letterEntryCount = signal(0);
  letterAttempted = signal(false);
  letterMessage = signal('');

  threads = signal<MemoryThread[]>([]);
  threadsLoading = signal(false);
  threadsMessage = signal('');

  exportToken = signal<string | null>(null);

  constructor(private api: DiaryApiService, public auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.api.getStreak().subscribe({
      next: s => {
        this.streak.set(s.streak);
        this.totalEntries.set(s.total_entries);
        this.nextMilestone.set(s.next_milestone);
        this.entriesToNext.set(s.entries_to_next);
        this.lastMilestone.set(s.last_milestone);
      },
      error: () => {},
    });

    this.threadsLoading.set(true);
    this.api.getMemoryThreads().subscribe({
      next: r => {
        this.threads.set(r.threads ?? []);
        this.threadsMessage.set(r.message ?? '');
        this.threadsLoading.set(false);
      },
      error: () => this.threadsLoading.set(false),
    });
  }

  loadLetter() {
    if (this.letterLoading()) return;
    this.letterLoading.set(true);
    this.api.getWeeklyLetter().subscribe({
      next: r => {
        this.weeklyLetter.set(r.letter ?? '');
        this.letterEntryCount.set(r.entry_count);
        this.letterMessage.set(r.message ?? '');
        this.letterLoading.set(false);
        this.letterAttempted.set(true);
      },
      error: () => {
        this.letterLoading.set(false);
        this.letterAttempted.set(true);
      },
    });
  }

  exportPdf() {
    const token = this.auth.getToken();
    const url = this.api.exportPdfUrl();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';

    // Add Authorization header via fetch then download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `ninaivugal_${this.auth.currentUser?.name ?? 'diary'}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  }

  get milestoneLabel(): string {
    const m = this.lastMilestone();
    const map: Record<number, string> = {
      1: 'First memory', 7: 'One week', 14: 'Fortnight', 30: 'One month',
      50: 'Fifty entries', 100: 'One hundred', 200: 'Two hundred', 365: 'One year',
    };
    return m ? map[m] ?? `${m} entries` : '';
  }

  get firstName(): string { return firstName(this.auth.currentUser?.name); }

  get streakMessage(): string {
    const s = this.streak();
    const n = this.firstName;
    if (s === 0) return n ? `Start today, ${n} — your first streak begins with one entry.` : 'Start today — your first streak begins with one entry.';
    if (s === 1) return n ? `One day, ${n}. The streak has begun.` : 'One day. The streak has begun.';
    if (s < 7) return `${s} days in a row. Something is forming.`;
    if (s < 14) return n ? `${s} days, ${n}. A proper habit now.` : `${s} days. A proper habit now.`;
    if (s < 30) return `${s} days without missing. Remarkable.`;
    return n ? `${s} consecutive days, ${n}. You have built something real.` : `${s} consecutive days. You have built something real.`;
  }
}
