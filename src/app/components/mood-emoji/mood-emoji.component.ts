import { Component, Input } from '@angular/core';

const MOOD_EMOJI: Record<string, string> = {
  joyful:    '/assets/svgs/emojis/happy-smile-laugh.svg',
  tender:    '/assets/svgs/emojis/kiss-emoji.svg',
  content:   '/assets/svgs/emojis/happy-smile-1.svg',
  uncertain: '/assets/svgs/emojis/happy-smile-upside.svg',
  heavy:     '/assets/svgs/emojis/sad.svg',
  anxious:   '/assets/svgs/emojis/anxious.svg',
};

@Component({
  selector: 'app-mood-emoji',
  standalone: true,
  template: `<img [src]="src" [class]="'mood-emoji mood-emoji--' + size" alt="" aria-hidden="true" />`,
  styles: [`
    .mood-emoji {
      display: block;
      object-fit: contain;
      flex-shrink: 0;
    }
    .mood-emoji--xs { width: 1.375rem; height: 1.375rem; }
    .mood-emoji--sm { width: 2rem;     height: 2rem;     }
    .mood-emoji--md { width: 2.75rem;  height: 2.75rem;  }
    .mood-emoji--lg { width: 3.5rem;   height: 3.5rem;   }
  `],
})
export class MoodEmojiComponent {
  @Input() primary = 'content';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';

  get src(): string {
    return MOOD_EMOJI[this.primary] ?? MOOD_EMOJI['content'];
  }
}
