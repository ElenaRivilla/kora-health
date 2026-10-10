import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { WaterTrackingService } from './services/water-tracking.service';

describe('app routes', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        // The Nutrición page loads its data on creation; these tests only cover navigation.
        {
          provide: WaterTrackingService,
          useValue: { getGoal: () => of(null), getHistory: () => of([]) },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('should redirect / to /salud', async () => {
    await harness.navigateByUrl('/');

    expect(router.url).toBe('/salud');
  });

  it('should redirect an unknown URL to /salud', async () => {
    await harness.navigateByUrl('/no-existe');

    expect(router.url).toBe('/salud');
  });

  it.each(['/salud', '/nutricion', '/entrenamiento', '/progreso', '/perfil'])(
    'should resolve %s',
    async (url) => {
      await harness.navigateByUrl(url);

      expect(router.url).toBe(url);
    },
  );
});
