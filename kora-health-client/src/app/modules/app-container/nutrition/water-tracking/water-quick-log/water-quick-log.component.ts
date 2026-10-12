import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { WaterTrackingStateService } from '../water-tracking-state.service';

/** Quick-log action: a single tap records a water intake entry. */
@Component({
  imports: [ButtonComponent],
  selector: 'app-water-quick-log',
  styleUrl: './water-quick-log.component.scss',
  templateUrl: './water-quick-log.component.html',
})
export class WaterQuickLogComponent {
  private readonly state = inject(WaterTrackingStateService);

  protected readonly quickAmounts = [100, 250, 500];

  protected log(amountMl: number): void {
    this.state.logEntry(amountMl);
  }
}
