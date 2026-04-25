import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { DiaryEntry, EMOTION_FLAGS, LANGUAGE_DISPLAY } from '../../models/diary.model';

const EMOTION_FLAG_MAP = new Map(EMOTION_FLAGS.map(f => [f.value, f]));

@Component({
  selector: 'app-diary-card',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './diary-card.component.html',
  styleUrl: './diary-card.component.css',
})
export class DiaryCardComponent {
  @Input() entry!: DiaryEntry;
  @Output() deleteEntry = new EventEmitter<string>();

  get langInfo() {
    const code = this.entry.detected_language ?? 'en';
    return LANGUAGE_DISPLAY[code] ?? { label: 'Unknown', class: 'lang-badge--en' };
  }

  get displayTitle(): string {
    return (
      this.entry.title_original ??
      this.entry.title_english ??
      'Untitled Entry'
    );
  }

  get displayExcerpt(): string {
    const content = this.entry.content_original ?? this.entry.content_english ?? '';
    return content.length > 160 ? content.slice(0, 160) + '…' : content;
  }

  get formattedDate(): string {
    return new Date(this.entry.created_at).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  get modeLabel(): string {
    const map: Record<string, string> = {
      SAME_LANGUAGE: '🌐',
      ENGLISH_REFINED: '✨',
      BILINGUAL: '🔀',
    };
    return map[this.entry.output_mode] ?? '';
  }

  get emotionInfo() {
    return this.entry.emotion_flag ? EMOTION_FLAG_MAP.get(this.entry.emotion_flag) ?? null : null;
  }

  get previewImages() {
    return this.entry.images.slice(0, 3);
  }

  get hasExtras(): boolean {
    return this.entry.emojis.length > 0 || !!this.entry.emotion_flag || this.entry.images.length > 0;
  }

  onDelete(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.deleteEntry.emit(this.entry.id);
  }
}
