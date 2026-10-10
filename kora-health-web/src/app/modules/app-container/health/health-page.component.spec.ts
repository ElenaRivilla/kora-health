import { TestBed } from '@angular/core/testing';
import { HealthPageComponent } from './health-page.component';

describe('HealthPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthPageComponent],
    }).compileComponents();
  });

  it('should render', () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
