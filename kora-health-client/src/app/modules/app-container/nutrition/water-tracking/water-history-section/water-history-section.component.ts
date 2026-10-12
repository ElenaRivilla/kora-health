import { Component, inject } from '@angular/core';
import { StatusMessageComponent } from '../../../shared/components/status-message/status-message.component';
import { WaterTrackingStateService } from '../water-tracking-state.service';

/** Daily water totals, in the order the API returns them. */
@Component({
  imports: [StatusMessageComponent],
  selector: 'app-water-history-section',
  styleUrl: './water-history-section.component.scss',
  templateUrl: './water-history-section.component.html',
})
export class WaterHistorySectionComponent {
  protected readonly state = inject(WaterTrackingStateService);
}
