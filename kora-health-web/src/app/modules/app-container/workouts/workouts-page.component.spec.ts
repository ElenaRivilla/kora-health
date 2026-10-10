import { TestBed } from '@angular/core/testing';
import { WorkoutsPageComponent } from './workouts-page.component';

describe('WorkoutsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutsPageComponent],
    }).compileComponents();
  });

  it('should render', () => {
    const fixture = TestBed.createComponent(WorkoutsPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
