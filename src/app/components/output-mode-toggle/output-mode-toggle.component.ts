import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OUTPUT_MODE_OPTIONS, OutputMode, OutputModeOption } from '../../models/diary.model';

@Component({
  selector: 'app-output-mode-toggle',
  standalone: true,
  imports: [],
  templateUrl: './output-mode-toggle.component.html',
  styleUrl: './output-mode-toggle.component.css',
})
export class OutputModeToggleComponent {
  @Input() selected: OutputMode = 'SAME_LANGUAGE';
  @Output() selectedChange = new EventEmitter<OutputMode>();

  options: OutputModeOption[] = OUTPUT_MODE_OPTIONS;

  select(mode: OutputMode) {
    this.selected = mode;
    this.selectedChange.emit(mode);
  }
}
