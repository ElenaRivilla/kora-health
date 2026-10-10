import { Component, inject } from '@angular/core';
import { WaterTrackingStateService } from '../water-tracking-state.service';

/** Daily water totals, in the order the API returns them. */
@Component({
  selector: 'app-water-history-section',
  styleUrl: './water-history-section.component.scss',
  templateUrl: './water-history-section.component.html',
})
export class WaterHistorySectionComponent {
  protected readonly state = inject(WaterTrackingStateService);
}
