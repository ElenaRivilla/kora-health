import { Routes } from '@angular/router';
import { HomeComponent } from './modules/app-container/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'salud' },
      {
        path: 'salud',
        title: 'Salud',
        loadComponent: () =>
          import('./modules/app-container/health/health-page.component').then(
            (m) => m.HealthPageComponent,
          ),
      },
      {
        path: 'nutricion',
        title: 'Nutrición',
        loadComponent: () =>
          import('./modules/app-container/nutrition/nutrition-page.component').then(
            (m) => m.NutritionPageComponent,
          ),
      },
      {
        path: 'entrenamiento',
        title: 'Entrenamiento',
        loadComponent: () =>
          import('./modules/app-container/workouts/workouts-page.component').then(
            (m) => m.WorkoutsPageComponent,
          ),
      },
      {
        path: 'progreso',
        title: 'Progreso',
        loadComponent: () =>
          import('./modules/app-container/progress/progress-page.component').then(
            (m) => m.ProgressPageComponent,
          ),
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () =>
          import('./modules/app-container/profile/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      // Component catalog, development builds only (`ngDevMode` is false in production, so the
      // route and its chunk are dropped). It has no title: it is not a navigation destination.
      ...(typeof ngDevMode === 'undefined' || ngDevMode
        ? [
            {
              path: 'catalogo',
              loadComponent: () =>
                import('./modules/app-container/catalog/catalog-page.component').then(
                  (m) => m.CatalogPageComponent,
                ),
            },
          ]
        : []),
    ],
  },
  { path: '**', redirectTo: '' },
];
