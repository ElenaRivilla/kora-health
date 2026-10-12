import { Component, ViewEncapsulation, contentChild, effect, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorWarningCircle } from '@ng-icons/phosphor-icons/regular';
import { InputDirective } from './input.directive';

/**
 * Label, hint and error around a projected `<input appInput>`. It links them to the input for
 * assistive technologies (`for`, `aria-describedby`, `aria-invalid`).
 */
@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorWarningCircle })],
  selector: 'app-field',
  styleUrl: './field.component.scss',
  templateUrl: './field.component.html',
  // The projected input belongs to the consumer's view; the styles are scoped by class name instead.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'field' },
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();

  protected readonly input = contentChild.required(InputDirective);

  constructor() {
    effect(() => {
      const { element, id } = this.input();
      const describedBy = [this.hint() ? `${id}-hint` : '', this.error() ? `${id}-error` : '']
        .filter(Boolean)
        .join(' ');

      if (describedBy) {
        element.setAttribute('aria-describedby', describedBy);
      } else {
        element.removeAttribute('aria-describedby');
      }
      if (this.error()) {
        element.setAttribute('aria-invalid', 'true');
      } else {
        element.removeAttribute('aria-invalid');
      }
    });
  }
}
