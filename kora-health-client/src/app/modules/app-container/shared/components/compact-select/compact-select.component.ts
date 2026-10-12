import { Component, input, model } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCaretDown } from '@ng-icons/phosphor-icons/regular';

export interface CompactSelectOption {
  value: string;
  label: string;
}

/** Native `<select>` shaped as a compact pill, e.g. a period selector in a card header. */
@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorCaretDown })],
  selector: 'app-compact-select',
  styleUrl: './compact-select.component.scss',
  templateUrl: './compact-select.component.html',
})
export class CompactSelectComponent {
  readonly options = input.required<readonly CompactSelectOption[]>();
  readonly value = model<string>();
  /** Accessible name of the select; it is not shown. */
  readonly label = input.required<string>();

  protected select(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
