import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OrbComponent } from '../../components/orb/orb.component';
import { DiaryApiService } from '../../services/diary-api.service';
import { GenerateRequest } from '../../models/diary.model';

const STEPS = [
  {
    status: 'Feeling the weight of your words',
    quote: 'Before anything else, we sit with what was said.',
    hue: 42,
  },
  {
    status: 'Finding the language underneath',
    quote: 'Every code-switch is a door — we\'re stepping through carefully.',
    hue: 56,
  },
  {
    status: 'Reaching into yesterday',
    quote: 'Nothing you feel today is the first time you\'ve felt it. That is a kindness.',
    hue: 200,
  },
  {
    status: 'Weaving it into something lasting',
    quote: 'The rough clay of a moment, becoming something you\'ll want to return to.',
    hue: 260,
  },
  {
    status: 'One final polish',
    quote: 'A diary entry should feel like a letter to your future self.',
    hue: 18,
  },
];

@Component({
  selector: 'app-generating',
  standalone: true,
  imports: [OrbComponent],
  templateUrl: './generating.component.html',
  styleUrl: './generating.component.css',
})
export class GeneratingComponent implements OnInit, OnDestroy {
  steps = STEPS;
  currentStep = signal(0);
  transcriptSnippet = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  private apiDone = false;
  private animDone = false;
  pendingEntryId: string | null = null;

  constructor(private router: Router, private api: DiaryApiService) {}

  ngOnInit() {
    const state = history.state as { req?: GenerateRequest };
    const draft = sessionStorage.getItem('nin.pendingDraft') ?? '';
    const lang = sessionStorage.getItem('nin.pendingLang') ?? 'auto';
    const date = sessionStorage.getItem('nin.pendingDate') ?? undefined;

    const req: GenerateRequest = state?.req ?? {
      transcript: draft,
      output_mode: 'auto' as any,
      language_override: lang,
      entry_date: date,
    };

    const snippet = req.transcript?.trim() ?? '';
    this.transcriptSnippet.set(snippet.length > 80 ? snippet.slice(0, 80) + '…' : snippet);

    if (req.transcript) {
      this.api.generate(req).subscribe({
        next: entry => {
          this.pendingEntryId = entry.id;
          this.apiDone = true;
          this.tryFinish();
        },
        error: () => { this.apiDone = true; this.tryFinish(); },
      });
    } else {
      this.apiDone = true;
    }

    this.advance();
  }

  private advance() {
    if (this.currentStep() < STEPS.length) {
      this.timer = setTimeout(() => {
        this.currentStep.update(s => s + 1);
        this.advance();
      }, 1600);
    } else {
      this.animDone = true;
      this.tryFinish();
    }
  }

  private tryFinish() {
    if (this.animDone && this.apiDone) {
      setTimeout(() => {
        this.router.navigate(['/entry', this.pendingEntryId ?? 'new']);
      }, 600);
    }
  }

  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }

  get cur() { return STEPS[Math.min(this.currentStep(), STEPS.length - 1)]; }
  get orbHue() { return this.cur.hue; }

  stepState(i: number): string {
    const s = this.currentStep();
    if (i < s) return 'done';
    if (i === s) return 'active';
    return '';
  }
}
