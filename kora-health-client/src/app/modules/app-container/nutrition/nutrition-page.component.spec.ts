import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WaterTrackingService } from '../../../services/water-tracking.service';
import { WaterEntryRs } from '../../../shared/entities/DTOS/water-tracking/water-entry-rs';
import { WaterHistoryDayRs } from '../../../shared/entities/DTOS/water-tracking/water-history-day-rs';
import { NutritionPageComponent } from './nutrition-page.component';

describe('NutritionPageComponent', () => {
  let history: WaterHistoryDayRs[];
  let fixture: ComponentFixture<NutritionPageComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    history = [{ date: '2026-10-10', totalMl: 250, goalMl: 2000 }];

    await TestBed.configureTestingModule({
      imports: [NutritionPageComponent],
      providers: [
        {
          provide: WaterTrackingService,
          useValue: {
            getGoal: () => of({ dailyGoalMl: 2000, dateUpdated: '2026-10-10T08:00:00Z' }),
            getHistory: () => of(history),
            logEntry: (amountMl: number) => {
              history = [{ date: '2026-10-10', totalMl: 250 + amountMl, goalMl: 2000 }];
              const entry: WaterEntryRs = { id: 2, amountMl, dateCreated: '2026-10-10T09:00:00Z' };
              return of(entry);
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionPageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('should render the hydration card and the hydration history card', () => {
    const titles = Array.from(element.querySelectorAll('app-card h2')).map((title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual(['Hidratación', 'Historial de hidratación']);

    const cards = element.querySelectorAll('app-card');
    expect(cards[0].querySelector('app-water-goal-section')).not.toBeNull();
    expect(cards[1].querySelector('app-water-quick-log')).not.toBeNull();
    expect(cards[1].querySelector('app-water-history-section')).not.toBeNull();
  });

  it('should show the data loaded through its own state service', () => {
    expect(element.textContent).toContain('Objetivo actual: 2000 ml');
    expect(element.textContent).toContain('250 ml / 2000 ml');
  });

  it('should update the history after a quick log, without reloading the page', () => {
    const plus250 = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '+250 ml',
    );
    plus250?.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('500 ml / 2000 ml');
  });
});
