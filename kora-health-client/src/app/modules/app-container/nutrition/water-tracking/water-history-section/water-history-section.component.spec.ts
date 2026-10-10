import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterHistoryDayRs } from '../../../../../shared/entities/DTOS/water-tracking/water-history-day-rs';
import { WaterTrackingStateService } from '../water-tracking-state.service';
import { WaterHistorySectionComponent } from './water-history-section.component';

describe('WaterHistorySectionComponent', () => {
  const history = signal<WaterHistoryDayRs[]>([]);
  const historyLoading = signal(false);
  const historyError = signal<string | null>(null);
  let fixture: ComponentFixture<WaterHistorySectionComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    history.set([]);
    historyLoading.set(false);
    historyError.set(null);

    await TestBed.configureTestingModule({
      imports: [WaterHistorySectionComponent],
      providers: [
        {
          provide: WaterTrackingStateService,
          useValue: { history, historyLoading, historyError },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaterHistorySectionComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function rows(): string[] {
    return Array.from(element.querySelectorAll('li')).map((row) =>
      (row.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  it('should list the days in the order received, with the date as it arrives', () => {
    history.set([
      { date: '2026-10-10', totalMl: 750, goalMl: 2000 },
      { date: '2026-10-08', totalMl: 500, goalMl: null },
      { date: '2026-10-09', totalMl: 1200 },
    ]);
    fixture.detectChanges();

    expect(rows()).toEqual([
      '2026-10-10 750 ml / 2000 ml',
      '2026-10-08 500 ml',
      '2026-10-09 1200 ml',
    ]);
  });

  it('should render an empty list, with no message, when there is no history', () => {
    expect(element.querySelector('ul')).not.toBeNull();
    expect(rows()).toEqual([]);
    expect(element.textContent?.trim()).toBe('');
  });

  it('should show the loading and the error states instead of the list', () => {
    historyLoading.set(true);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');
    expect(element.querySelector('ul')).toBeNull();

    historyLoading.set(false);
    historyError.set('sin conexión');
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Error: sin conexión',
    );
    expect(element.querySelector('ul')).toBeNull();
  });
});
