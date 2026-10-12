import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';
import { InputDirective } from './input.directive';

@Component({
  imports: [FieldComponent, InputDirective],
  template: `
    <app-field label="Nuevo objetivo (ml)" [hint]="hint()" [error]="error()">
      <input #own appInput id="own-input" type="number" inputmode="numeric" min="1" />
    </app-field>
    <app-field label="Nombre">
      <input appInput type="text" />
    </app-field>
  `,
})
class HostComponent {
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly own = viewChild.required<ElementRef<HTMLInputElement>>('own');
}

describe('FieldComponent', () => {
  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('should name the field with its label, also when the input has no id', async () => {
    const { element } = await setup();
    const [first, second] = Array.from(element.querySelectorAll('input'));
    const labels = Array.from(element.querySelectorAll('label'));

    expect(labels[0].htmlFor).toBe('own-input');
    expect(labels[0].textContent?.trim()).toBe('Nuevo objetivo (ml)');
    expect(first.labels?.[0]).toBe(labels[0]);
    expect(second.id).toBeTruthy();
    expect(second.labels?.[0]?.textContent?.trim()).toBe('Nombre');
  });

  it('should link the hint and the error to the field', async () => {
    const { fixture, element } = await setup();
    const input = element.querySelector('input')!;
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    fixture.componentInstance.hint.set('Entre 1 y 10000');
    fixture.componentInstance.error.set('Valor no válido');
    await fixture.whenStable();

    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => element.querySelector(`#${id}`)?.textContent?.trim())).toEqual([
      'Entre 1 y 10000',
      'Valor no válido',
    ]);
  });

  it('should mark the field as invalid only while there is an error', async () => {
    const { fixture, element } = await setup();
    const input = element.querySelector('input')!;
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.error.set('Valor no válido');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.error.set(undefined);
    await fixture.whenStable();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it("should keep the consumer's own input", async () => {
    const { fixture, element } = await setup();
    const input = element.querySelector('input')!;

    expect(fixture.componentInstance.own().nativeElement).toBe(input);
    expect(input.id).toBe('own-input');
    expect(input.type).toBe('number');
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });
});
