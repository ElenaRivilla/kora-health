import { TestBed } from '@angular/core/testing';
import { ProgressPageComponent } from './progress-page.component';

describe('ProgressPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPageComponent],
    }).compileComponents();
  });

  it('should render', () => {
    const fixture = TestBed.createComponent(ProgressPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
