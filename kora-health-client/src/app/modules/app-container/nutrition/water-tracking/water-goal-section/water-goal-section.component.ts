import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FieldComponent } from '../../../shared/components/field/field.component';
import { InputDirective } from '../../../shared/components/field/input.directive';
import { StatusMessageComponent } from '../../../shared/components/status-message/status-message.component';
import { WaterTrackingStateService } from '../water-tracking-state.service';

/** Shows the current daily water goal and lets the user set a new one. */
@Component({
  imports: [ButtonComponent, FieldComponent, InputDirective, StatusMessageComponent],
  selector: 'app-water-goal-section',
  styleUrl: './water-goal-section.component.scss',
  templateUrl: './water-goal-section.component.html',
})
export class WaterGoalSectionComponent {
  protected readonly state = inject(WaterTrackingStateService);

  protected save(event: Event, input: HTMLInputElement): void {
    event.preventDefault();

    // Format check only: empty, non-integer and non-positive values are ignored.
    const raw = input.value.trim();
    const value = Number(raw);
    if (raw === '' || !Number.isInteger(value) || value <= 0) {
      return;
    }

    this.state.setGoal(value);
    input.value = '';
  }
}
