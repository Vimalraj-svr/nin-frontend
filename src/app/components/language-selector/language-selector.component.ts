import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LANGUAGE_OPTIONS, LanguageCode, LanguageOption } from '../../models/diary.model';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.css',
})
export class LanguageSelectorComponent {
  @Input() selected: LanguageCode = 'auto';
  @Output() selectedChange = new EventEmitter<LanguageCode>();

  options: LanguageOption[] = LANGUAGE_OPTIONS;

  select(code: LanguageCode) {
    this.selected = code;
    this.selectedChange.emit(code);
  }
}
