import { TestBed } from '@angular/core/testing';
import { WaterTrackingStateService } from '../water-tracking-state.service';
import { WaterQuickLogComponent } from './water-quick-log.component';

describe('WaterQuickLogComponent', () => {
  let loggedAmounts: number[];
  let buttons: HTMLButtonElement[];

  beforeEach(async () => {
    loggedAmounts = [];
    await TestBed.configureTestingModule({
      imports: [WaterQuickLogComponent],
      providers: [
        {
          provide: WaterTrackingStateService,
          useValue: { logEntry: (amountMl: number) => loggedAmounts.push(amountMl) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WaterQuickLogComponent);
    fixture.detectChanges();
    buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  });

  it('should render the three quick amounts', () => {
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      '+100 ml',
      '+250 ml',
      '+500 ml',
    ]);
  });

  it('should log the amount of the pressed button with a single click', () => {
    buttons[0].click();
    expect(loggedAmounts).toEqual([100]);

    buttons[1].click();
    expect(loggedAmounts).toEqual([100, 250]);

    buttons[2].click();
    expect(loggedAmounts).toEqual([100, 250, 500]);
  });
});
