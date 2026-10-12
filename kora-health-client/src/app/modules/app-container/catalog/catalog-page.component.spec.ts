import { TestBed } from '@angular/core/testing';
import { CatalogPageComponent } from './catalog-page.component';

describe('CatalogPageComponent', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render at least one of each base component', async () => {
    const fixture = TestBed.createComponent(CatalogPageComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-card')).not.toBeNull();
    expect(element.querySelector('[appButton]')).not.toBeNull();
    expect(element.querySelector('app-field input')).not.toBeNull();
    expect(element.querySelector('app-compact-select select')).not.toBeNull();
    expect(element.querySelectorAll('app-status-message').length).toBeGreaterThanOrEqual(3);
  });
});
