import { Component, Input } from '@angular/core';

const MOOD_EMOJI: Record<string, string> = {
  elated:    '/assets/svgs/emojis/star-eyes.svg',
  joyful:    '/assets/svgs/emojis/happy-smile-laugh.svg',
  playful:   '/assets/svgs/emojis/happy-smile-wink.svg',
  loving:    '/assets/svgs/emojis/heart.svg',
  tender:    '/assets/svgs/emojis/kiss-emoji.svg',
  grateful:  '/assets/svgs/emojis/flower.svg',
  content:   '/assets/svgs/emojis/happy-smile-1.svg',
  peaceful:  '/assets/svgs/emojis/sun.svg',
  dreamy:    '/assets/svgs/emojis/moon.svg',
  pensive:   '/assets/svgs/emojis/thinking.svg',
  uncertain: '/assets/svgs/emojis/happy-smile-upside.svg',
  heavy:     '/assets/svgs/emojis/sad.svg',
  anxious:   '/assets/svgs/emojis/anxious.svg',
  numb:      '/assets/svgs/emojis/dead.svg',
};

@Component({
  selector: 'app-mood-emoji',
  standalone: true,
  template: `<img [src]="src" [class]="'mood-emoji mood-emoji--' + size" alt="" aria-hidden="true" />`,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; }
    .mood-emoji {
      display: block;
      object-fit: contain;
      flex-shrink: 0;
    }
    .mood-emoji--xs { width: 1.375rem; height: 1.375rem; }
    .mood-emoji--sm { width: 2rem;     height: 2rem;     }
    .mood-emoji--md { width: 2.75rem;  height: 2.75rem;  }
    .mood-emoji--lg { width: 3.5rem;   height: 3.5rem;   }
    .mood-emoji--xl { width: 4.25rem;  height: 4.25rem;  }
    .mood-emoji--xxl { width: 5rem;     height: 5rem;  }
    .mood-emoji--xxxl { width: 5.75rem;  height: 5.75rem;  }
    .mood-emoji--xxxxl { width: 6.5rem;  height: 6.5rem;  }
  `],
})
export class MoodEmojiComponent {
  @Input() primary = 'content';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' = 'sm';

  get src(): string {
    return MOOD_EMOJI[this.primary] ?? MOOD_EMOJI['content'];
  }
}
