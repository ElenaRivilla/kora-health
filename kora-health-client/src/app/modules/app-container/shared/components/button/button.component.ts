import {
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Button look for native `<button>` and `<a>` elements: `<button appButton="secondary">`.
 * The element keeps its own behaviour (type, form submission, disabled, router links).
 */
@Component({
  // An attribute selector on the native elements keeps their behaviour without extra code.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  styleUrl: './button.component.scss',
  template: '<ng-content />',
  host: {
    '[class]': 'hostClass()',
  },
})
export class ButtonComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Variant, given as the value of the attribute; empty means primary. */
  readonly appButton = input<ButtonVariant | ''>('');
  /** Circular button that only shows an icon; it needs an `aria-label`. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  protected readonly variant = computed<ButtonVariant>(() => this.appButton() || 'primary');

  protected readonly hostClass = computed(
    () =>
      `app-button app-button--${this.variant()}` + (this.iconOnly() ? ' app-button--icon-only' : ''),
  );

  constructor() {
    if (ngDevMode) {
      afterNextRender(() => {
        if (this.iconOnly() && !this.element.getAttribute('aria-label')) {
          console.warn('appButton: an icon-only button needs an aria-label.', this.element);
        }
      });
    }
  }
}
