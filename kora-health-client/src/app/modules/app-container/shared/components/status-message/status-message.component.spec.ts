import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusMessageComponent, StatusMessageKind } from './status-message.component';

@Component({
  imports: [StatusMessageComponent],
  template: `
    <app-status-message [kind]="kind()" [retryLabel]="retryLabel()" (retry)="retries = retries + 1">
      {{ message() }}
    </app-status-message>
  `,
})
class HostComponent {
  readonly kind = signal<StatusMessageKind>('loading');
  readonly retryLabel = signal<string | undefined>(undefined);
  readonly message = signal('Cargando…');
  retries = 0;
}

describe('StatusMessageComponent', () => {
  async function setup(kind: StatusMessageKind, message: string, retryLabel?: string) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.kind.set(kind);
    fixture.componentInstance.message.set(message);
    fixture.componentInstance.retryLabel.set(retryLabel);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('should announce loading as a status with the exact message', async () => {
    const { element } = await setup('loading', 'Cargando…');
    const status = element.querySelector('[role="status"]');

    expect(status?.textContent?.trim()).toBe('Cargando…');
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(status?.querySelector('ng-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should announce an error as an alert with the exact message', async () => {
    const { element } = await setup('error', 'Error: sin conexión', 'Reintentar');
    const alert = element.querySelector('[role="alert"]');

    // The icon adds no text and the retry button stays outside the alert.
    expect(alert?.textContent?.trim()).toBe('Error: sin conexión');
    expect(alert?.querySelector('ng-icon')).not.toBeNull();
    expect(alert?.querySelector('button')).toBeNull();
  });

  it('should show an empty state without any role', async () => {
    const { element } = await setup('empty', 'Sin registros');

    expect(element.querySelector('[role]')).toBeNull();
    expect(element.textContent?.trim()).toBe('Sin registros');
    expect(element.querySelector('ng-icon')).toBeNull();
  });

  it('should show the retry button only on an error with a retry label', async () => {
    expect((await setup('error', 'Error: sin conexión')).element.querySelector('button')).toBeNull();
    expect((await setup('loading', 'Cargando…', 'Reintentar')).element.querySelector('button')).toBeNull();
    expect((await setup('empty', 'Sin registros', 'Reintentar')).element.querySelector('button')).toBeNull();
  });

  it('should emit retry when the retry button is pressed', async () => {
    const { fixture, element } = await setup('error', 'Error: sin conexión', 'Reintentar');
    const button = element.querySelector('button')!;

    expect(button.textContent?.trim()).toBe('Reintentar');
    button.click();

    expect(fixture.componentInstance.retries).toBe(1);
  });
});
