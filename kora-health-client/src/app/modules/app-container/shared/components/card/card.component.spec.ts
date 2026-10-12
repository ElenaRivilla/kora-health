import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

@Component({
  imports: [CardComponent],
  template: `
    <app-card id="plain" title="Hidratación"><p class="body">Contenido</p></app-card>
    <app-card id="full" title="Estadísticas" subtitle="Últimos 30 días">
      <select appCardControl aria-label="Periodo"></select>
      <p class="body">Gráfico</p>
    </app-card>
  `,
})
class HostComponent {}

describe('CardComponent', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  const card = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;

  it('should render the title and the projected content', () => {
    expect(card('plain').querySelector('h2')?.textContent?.trim()).toBe('Hidratación');
    expect(card('plain').querySelector('.card__body .body')?.textContent).toBe('Contenido');
  });

  it('should render the subtitle only when given', () => {
    expect(card('full').querySelector('.card__subtitle')?.textContent?.trim()).toBe('Últimos 30 días');
    expect(card('plain').querySelector('.card__subtitle')).toBeNull();
  });

  it('should place the projected control in the header, outside the body', () => {
    const control = card('full').querySelector('select');
    expect(control?.closest('.card__header')).not.toBeNull();
    expect(control?.closest('.card__body')).toBeNull();
    expect(card('plain').querySelector('.card__control')?.children.length).toBe(0);
  });

  it('should name the section by its title', () => {
    const section = card('full').querySelector('section')!;
    const titleId = section.getAttribute('aria-labelledby');

    expect(titleId).toBeTruthy();
    expect(element.querySelector(`#${titleId}`)?.textContent?.trim()).toBe('Estadísticas');
    expect(card('plain').querySelector('section')?.getAttribute('aria-labelledby')).not.toBe(titleId);
  });
});
