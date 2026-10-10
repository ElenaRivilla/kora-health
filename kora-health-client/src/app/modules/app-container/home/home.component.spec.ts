import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../../app.routes';
import { WaterTrackingService } from '../../../services/water-tracking.service';

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

  it('should render the five destinations in order', () => {
    const labels = Array.from(element.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(labels).toEqual(['Salud', 'Nutrición', 'Entrenamiento', 'Progreso', 'Perfil']);
  });

  it('should show the active section title in the header and mark its destination', () => {
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Nutrición');

    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('Nutrición');
  });

  it('should update the title when navigating to another section', async () => {
    await harness.navigateByUrl('/perfil');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Perfil');
  });
});
