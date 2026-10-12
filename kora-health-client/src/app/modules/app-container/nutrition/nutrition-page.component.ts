import { Component } from '@angular/core';
import { CardComponent } from '../shared/components/card/card.component';
import { WaterGoalSectionComponent } from './water-tracking/water-goal-section/water-goal-section.component';
import { WaterHistorySectionComponent } from './water-tracking/water-history-section/water-history-section.component';
import { WaterQuickLogComponent } from './water-tracking/water-quick-log/water-quick-log.component';
import { WaterTrackingStateService } from './water-tracking/water-tracking-state.service';

@Component({
  imports: [
    CardComponent,
    WaterGoalSectionComponent,
    WaterHistorySectionComponent,
    WaterQuickLogComponent,
  ],
  providers: [WaterTrackingStateService],
  selector: 'app-nutrition-page',
  styleUrl: './nutrition-page.component.scss',
  templateUrl: './nutrition-page.component.html',
})
export class NutritionPageComponent {}
