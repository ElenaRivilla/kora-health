import { TestBed } from '@angular/core/testing';
import { NutritionPageComponent } from './nutrition-page.component';

describe('NutritionPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionPageComponent],
    }).compileComponents();
  });

  it('should render', () => {
    const fixture = TestBed.createComponent(NutritionPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
