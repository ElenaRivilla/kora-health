import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CompactSelectComponent, CompactSelectOption } from './compact-select.component';

@Component({
  imports: [CompactSelectComponent],
  template: `<app-compact-select label="Periodo" [options]="options" [(value)]="value" />`,
})
class HostComponent {
  readonly options: CompactSelectOption[] = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
  ];
  readonly value = signal('30');
}

describe('CompactSelectComponent', () => {
  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    return { fixture, select };
  }

  it('should render the options it receives', async () => {
    const { select } = await setup();

    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'Últimos 7 días',
      'Últimos 30 días',
      'Últimos 90 días',
    ]);
  });

  it('should mark the selected option', async () => {
    const { select } = await setup();

    expect(select.value).toBe('30');
  });

  it('should emit the chosen option', async () => {
    const { fixture, select } = await setup();

    select.value = '90';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('90');
  });

  it('should expose its label as the accessible name', async () => {
    const { select } = await setup();

    expect(select.getAttribute('aria-label')).toBe('Periodo');
  });
});
