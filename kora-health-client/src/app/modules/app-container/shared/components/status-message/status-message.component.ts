import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCircleNotch, phosphorWarningCircle } from '@ng-icons/phosphor-icons/regular';
import { ButtonComponent } from '../button/button.component';

export type StatusMessageKind = 'loading' | 'error' | 'empty';

/**
 * Loading, error and empty states with the projected message. The error retry button, when
 * there is one, stays outside the alert, so that the alert text is exactly the message.
 */
@Component({
  imports: [ButtonComponent, NgIcon],
  providers: [provideIcons({ phosphorCircleNotch, phosphorWarningCircle })],
  selector: 'app-status-message',
  styleUrl: './status-message.component.scss',
  templateUrl: './status-message.component.html',
})
export class StatusMessageComponent {
  readonly kind = input.required<StatusMessageKind>();
  readonly retryLabel = input<string>();
  readonly retry = output<void>();

  protected readonly role = computed(() => {
    switch (this.kind()) {
      case 'loading':
        return 'status';
      case 'error':
        return 'alert';
      default:
        return null;
    }
  });
}
