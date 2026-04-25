import { Component, Input } from '@angular/core';
import { DiaryEntry } from '../../models/diary.model';

@Component({
  selector: 'app-bilingual-tabs',
  standalone: true,
  imports: [],
  templateUrl: './bilingual-tabs.component.html',
  styleUrl: './bilingual-tabs.component.css',
})
export class BilingualTabsComponent {
  @Input() entry!: DiaryEntry;
  activeTab: 'original' | 'english' = 'original';

  get hasOriginal(): boolean {
    return !!(this.entry?.content_original);
  }

  get hasEnglish(): boolean {
    return !!(this.entry?.content_english);
  }

  get showTabs(): boolean {
    return this.entry?.output_mode === 'BILINGUAL' && this.hasOriginal && this.hasEnglish;
  }

  get displayTitle(): string {
    if (this.showTabs) {
      return this.activeTab === 'original'
        ? (this.entry.title_original ?? '')
        : (this.entry.title_english ?? '');
    }
    return this.entry?.title_original ?? this.entry?.title_english ?? 'Untitled';
  }

  get displayContent(): string {
    if (this.showTabs) {
      return this.activeTab === 'original'
        ? (this.entry.content_original ?? '')
        : (this.entry.content_english ?? '');
    }
    return this.entry?.content_original ?? this.entry?.content_english ?? '';
  }
}
