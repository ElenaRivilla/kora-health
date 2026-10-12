import { Directive, ElementRef, inject } from '@angular/core';

let nextId = 0;

/**
 * Marks the native `<input>` that `app-field` labels and styles. The input stays in the
 * consumer's template, with its own reference, type and validations.
 */
@Directive({
  selector: 'input[appInput]',
  host: { class: 'field__input' },
})
export class InputDirective {
  readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  /** The input's own id or, when it has none, a generated one. */
  readonly id: string;

  constructor() {
    if (!this.element.id) {
      this.element.id = `app-field-input-${nextId++}`;
    }
    this.id = this.element.id;
  }
}
