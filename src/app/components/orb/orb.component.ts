import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-orb',
  standalone: true,
  template: `<div class="orb" [class]="sizeClass" [style.--h]="hue" [style.--w]="warmth"></div>`,
})
export class OrbComponent {
  @Input() hue = 56;
  @Input() warmth = 0.7;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() breathing = false;

  get sizeClass(): string {
    const s = this.size !== 'md' ? this.size : '';
    const p = `p-${Math.abs(Math.round(this.hue * 7)) % 5}`;
    return [s, this.breathing ? 'breathing' : '', p].filter(Boolean).join(' ');
  }
}
