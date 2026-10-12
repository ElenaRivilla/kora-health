import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `
    <button id="default" appButton type="submit"><span class="label">Guardar</span></button>
    <button id="secondary" appButton="secondary" type="button">Cancelar</button>
    <button id="danger" appButton="danger" type="button" disabled>Borrar</button>
    <button id="icon" appButton="secondary" iconOnly type="button" aria-label="Cerrar">×</button>
    <a id="link" appButton="secondary" href="/salud">Ir a Salud</a>
  `,
})
class HostComponent {}

describe('ButtonComponent', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;

  it('should be primary by default', () => {
    expect(byId('default').classList).toContain('app-button--primary');
  });

  it('should apply the class of each variant', () => {
    expect(byId('secondary').classList).toContain('app-button--secondary');
    expect(byId('danger').classList).toContain('app-button--danger');
    expect(byId('secondary').classList).not.toContain('app-button--primary');
  });

  it('should mark icon-only buttons', () => {
    expect(byId('icon').classList).toContain('app-button--icon-only');
    expect(byId('default').classList).not.toContain('app-button--icon-only');
  });

  it('should keep the projected content and the native attributes', () => {
    const submit = byId('default') as HTMLButtonElement;
    expect(submit.tagName).toBe('BUTTON');
    expect(submit.type).toBe('submit');
    expect(submit.querySelector('.label')?.textContent).toBe('Guardar');
    expect((byId('danger') as HTMLButtonElement).disabled).toBe(true);
    expect(byId('icon').getAttribute('aria-label')).toBe('Cerrar');
  });

  it('should work on a link', () => {
    const link = byId('link') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/salud');
    expect(link.classList).toContain('app-button--secondary');
    expect(link.textContent?.trim()).toBe('Ir a Salud');
  });
});
