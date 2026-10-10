import { TestBed } from '@angular/core/testing';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
    }).compileComponents();
  });

  it('should render', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
