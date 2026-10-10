import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionCardComponent } from './section-card.component';

@Component({
  imports: [SectionCardComponent],
  template: `<app-section-card title="Hidratación"><p>Contenido</p></app-section-card>`,
})
class HostComponent {}

describe('SectionCardComponent', () => {
  it('should render the title and the projected content', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Hidratación');
    expect(element.querySelector('.section-card__content p')?.textContent).toBe('Contenido');
  });
});
