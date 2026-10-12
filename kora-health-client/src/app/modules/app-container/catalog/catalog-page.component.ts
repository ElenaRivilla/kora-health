import { Component, inject, signal } from '@angular/core';
import { ThemePreference, ThemeService } from '../../../shared/theme/theme.service';
import { ButtonComponent } from '../shared/components/button/button.component';
import { CardComponent } from '../shared/components/card/card.component';
import {
  CompactSelectComponent,
  CompactSelectOption,
} from '../shared/components/compact-select/compact-select.component';
import { FieldComponent } from '../shared/components/field/field.component';
import { InputDirective } from '../shared/components/field/input.directive';
import { StatusMessageComponent } from '../shared/components/status-message/status-message.component';

/**
 * Development-only page (`/catalogo`) that shows every base component in all its variants and
 * states with fixed data, to review them at 375 px and 1280 px in both themes.
 */
@Component({
  imports: [
    ButtonComponent,
    CardComponent,
    CompactSelectComponent,
    FieldComponent,
    InputDirective,
    StatusMessageComponent,
  ],
  selector: 'app-catalog-page',
  styleUrl: './catalog-page.component.scss',
  templateUrl: './catalog-page.component.html',
})
export class CatalogPageComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly preferences: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
  ];

  protected readonly periods: CompactSelectOption[] = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 90 días' },
  ];
  protected readonly period = signal('30');

  protected readonly retries = signal(0);

  protected readonly colorRoles = [
    '--color-bg',
    '--color-surface',
    '--color-surface-raised',
    '--color-text',
    '--color-text-secondary',
    '--color-text-disabled',
    '--color-border',
    '--color-border-strong',
    '--color-accent',
    '--color-on-accent',
    '--color-accent-strong',
    '--color-accent-soft',
    '--color-accent-muted',
    '--color-focus-ring',
    '--color-success',
    '--color-success-fill',
    '--color-on-success',
    '--color-warning',
    '--color-danger',
    '--color-danger-fill',
    '--color-on-danger',
    '--color-data-neutral',
  ];
}
