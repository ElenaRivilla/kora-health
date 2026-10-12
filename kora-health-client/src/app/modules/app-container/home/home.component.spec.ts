import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../../app.routes';
import { WaterTrackingService } from '../../../services/water-tracking.service';
import { HOME_DESTINATIONS } from './home-destinations';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        // The Nutrición page loads its data on creation; these tests only cover the shell.
        {
          provide: WaterTrackingService,
          useValue: { getGoal: () => of(null), getHistory: () => of([]) },
        },
      ],
    });
    harness = await RouterTestingHarness.create('/nutricion');
    element = harness.routeNativeElement as HTMLElement;
  });

  function links(): HTMLAnchorElement[] {
    return Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));
  }

  it('should render the five destinations in order', () => {
    const labels = links().map((link) => link.textContent?.trim());

    expect(labels).toEqual(['Salud', 'Nutrición', 'Entreno', 'Progreso', 'Perfil']);
    // The accessible name of each link is its visible text.
    expect(links().some((link) => link.hasAttribute('aria-label'))).toBe(false);
  });

  it('should render both icons of each destination, hidden from assistive technologies', () => {
    for (const link of links()) {
      const icons = Array.from(link.querySelectorAll('ng-icon'));

      expect(icons.length).toBe(2);
      for (const icon of icons) {
        expect(icon.querySelector('svg')).not.toBeNull();
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      }
    }
  });

  it('should show the active section title in the header and mark its destination', () => {
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Nutrición');

    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('Nutrición');
    expect(active[0].classList).toContain('home__nav-link--active');

    const others = links().filter((link) => link !== active[0]);
    expect(others.some((link) => link.classList.contains('home__nav-link--active'))).toBe(false);
    expect(others.some((link) => link.hasAttribute('aria-current'))).toBe(false);
  });

  it('should update the title when navigating to another section', async () => {
    await harness.navigateByUrl('/perfil');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Perfil');
  });

  it('should show the full title of a destination whose label is shortened', async () => {
    await harness.navigateByUrl('/entrenamiento');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Entrenamiento');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent?.trim()).toBe('Entreno');
  });

  it('should match every destination with a child route that declares a title', () => {
    const children = routes[0].children ?? [];

    for (const destination of HOME_DESTINATIONS) {
      const child = children.find((route) => route.path === destination.path);
      expect(typeof child?.title, destination.path).toBe('string');
    }
  });
});

describe('HomeComponent with an inner view', () => {
  @Component({ template: '' })
  class InnerViewComponent {}

  // A section with an inner view; no real section has child routes yet.
  const innerRoutes: Routes = [
    {
      path: '',
      component: HomeComponent,
      children: [
        { path: 'salud', title: 'Salud', component: InnerViewComponent },
        {
          path: 'nutricion',
          title: 'Nutrición',
          children: [
            { path: '', component: InnerViewComponent },
            { path: 'detalle', title: 'Detalle', component: InnerViewComponent },
          ],
        },
        { path: 'entrenamiento', title: 'Entrenamiento', component: InnerViewComponent },
        { path: 'progreso', title: 'Progreso', component: InnerViewComponent },
        { path: 'perfil', title: 'Perfil', component: InnerViewComponent },
      ],
    },
  ];

  it('should keep the section destination active in an inner view', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(innerRoutes)] });
    const harness = await RouterTestingHarness.create('/nutricion/detalle');
    const element = harness.routeNativeElement as HTMLElement;

    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('Nutrición');
  });
});
