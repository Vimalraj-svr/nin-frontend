import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiaryApiService } from '../../services/diary-api.service';
import { AuthService } from '../../services/auth.service';
import { firstName } from '../../utils/personalize';

interface Message { role: 'user' | 'self'; text: string; }

const STARTERS = [
  'What have I been most afraid of lately?',
  'When did I last feel completely like myself?',
  'What decision have I been putting off?',
  'What keeps coming back no matter what?',
  'Who has had the most space in my mind?',
  'What have I been afraid to write about?',
  'What did this past week actually feel like?',
  'What do I keep telling myself is fine?',
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  @ViewChild('bottom') bottomEl!: ElementRef;

  messages = signal<Message[]>([]);
  input = '';
  loading = signal(false);
  starters = STARTERS;
  totalEntries = signal(0);

  get firstName(): string { return firstName(this.auth.currentUser?.name); }

  constructor(private api: DiaryApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getStreak().subscribe({
      next: s => this.totalEntries.set(s.total_entries),
      error: () => {},
    });
  }

  ask(question?: string) {
    const q = (question ?? this.input).trim();
    if (!q || this.loading()) return;
    this.input = '';

    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.loading.set(true);

    this.api.askPastSelf(q).subscribe({
      next: r => {
        this.messages.update(m => [...m, { role: 'self', text: r.answer }]);
        this.loading.set(false);
        setTimeout(() => this.bottomEl?.nativeElement?.scrollIntoView({ behavior: 'smooth' }), 60);
      },
      error: () => {
        this.messages.update(m => [...m, { role: 'self', text: 'Something went quiet. Try again in a moment.' }]);
        this.loading.set(false);
      },
    });
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.ask(); }
  }
}
