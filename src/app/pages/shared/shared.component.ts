import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DiaryApiService } from '../../services/diary-api.service';
import { DiaryEntry } from '../../models/diary.model';

@Component({
  selector: 'app-shared',
  standalone: true,
  imports: [],
  templateUrl: './shared.component.html',
  styleUrl: './shared.component.css',
})
export class SharedComponent implements OnInit {
  entry: DiaryEntry | null = null;
  error = '';
  loading = true;

  constructor(private route: ActivatedRoute, private api: DiaryApiService) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.getSharedEntry(token).subscribe({
      next: e => { this.entry = e; this.loading = false; },
      error: err => {
        this.error = err?.error?.detail ?? 'This link has expired or doesn\'t exist.';
        this.loading = false;
      },
    });
  }

  get title(): string { return this.entry?.title_original ?? this.entry?.title_english ?? 'Untitled'; }
  get body(): string[] {
    const t = this.entry?.content_original ?? this.entry?.content_english ?? '';
    return t.split(/\n\n+/).filter(Boolean);
  }
  get dateLabel(): string {
    if (!this.entry) return '';
    return new Date(this.entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
