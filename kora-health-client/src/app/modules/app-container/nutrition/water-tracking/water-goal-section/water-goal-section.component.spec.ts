import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterGoalRs } from '../../../../../shared/entities/DTOS/water-tracking/water-goal-rs';
import { WaterTrackingStateService } from '../water-tracking-state.service';
import { WaterGoalSectionComponent } from './water-goal-section.component';

describe('WaterGoalSectionComponent', () => {
  const goal = signal<WaterGoalRs | null>(null);
  const goalLoading = signal(false);
  const goalError = signal<string | null>(null);
  let savedGoals: number[];
  let fixture: ComponentFixture<WaterGoalSectionComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    goal.set(null);
    goalLoading.set(false);
    goalError.set(null);
    savedGoals = [];

    await TestBed.configureTestingModule({
      imports: [WaterGoalSectionComponent],
      providers: [
        {
          provide: WaterTrackingStateService,
          useValue: {
            goal,
            goalLoading,
            goalError,
            setGoal: (dailyGoalMl: number) => savedGoals.push(dailyGoalMl),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaterGoalSectionComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function submit(value: string): void {
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = value;
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('should say there is no goal yet, with the field and the save button', () => {
    expect(element.textContent).toContain('Sin objetivo configurado todavía');
    expect(element.querySelector('label')?.textContent?.trim()).toBe('Nuevo objetivo (ml)');
    expect(element.querySelector('button')?.textContent?.trim()).toBe('Guardar objetivo');
  });

  it('should show the current goal in ml', () => {
    goal.set({ dailyGoalMl: 2000, dateUpdated: '2026-10-10T08:00:00Z' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Objetivo actual: 2000 ml');
  });

  it('should show the loading and the error states', () => {
    goalLoading.set(true);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');

    goalLoading.set(false);
    goalError.set('sin conexión');
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Error: sin conexión',
    );
  });

  it('should save a valid goal', () => {
    submit('2500');

    expect(savedGoals).toEqual([2500]);
  });

  it('should ignore empty, non-positive and non-integer values', () => {
    submit('');
    submit('0');
    submit('-200');
    submit('2.5');

    expect(savedGoals).toEqual([]);
  });
});
