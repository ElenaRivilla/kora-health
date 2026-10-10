import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WaterTrackingService } from '../../../../services/water-tracking.service';
import { WaterGoalRs } from '../../../../shared/entities/DTOS/water-tracking/water-goal-rs';
import { WaterHistoryDayRs } from '../../../../shared/entities/DTOS/water-tracking/water-history-day-rs';

/**
 * State of the water-tracking feature: the daily goal and the history, each with its own loading
 * and error state. Not global: provided by the page that hosts the feature, and it starts loading
 * as soon as it is created.
 */
@Injectable()
export class WaterTrackingStateService {
  private readonly waterTracking = inject(WaterTrackingService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly goalState = signal<WaterGoalRs | null>(null);
  private readonly goalLoadingState = signal(false);
  private readonly goalErrorState = signal<string | null>(null);

  private readonly historyState = signal<WaterHistoryDayRs[]>([]);
  private readonly historyLoadingState = signal(false);
  private readonly historyErrorState = signal<string | null>(null);

  /** `null` while there is no goal configured. */
  readonly goal = this.goalState.asReadonly();
  readonly goalLoading = this.goalLoadingState.asReadonly();
  readonly goalError = this.goalErrorState.asReadonly();

  readonly history = this.historyState.asReadonly();
  readonly historyLoading = this.historyLoadingState.asReadonly();
  readonly historyError = this.historyErrorState.asReadonly();

  constructor() {
    this.fetchGoal(true);
    this.fetchHistory(true);
  }

  setGoal(dailyGoalMl: number): void {
    this.waterTracking
      .setGoal(dailyGoalMl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // The history carries each day's goal, so it is reloaded together with the goal.
        next: () => {
          this.fetchGoal(false);
          this.fetchHistory(false);
        },
        error: (error: unknown) => this.goalErrorState.set(errorMessage(error)),
      });
  }

  logEntry(amountMl: number): void {
    this.waterTracking
      .logEntry(amountMl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.fetchHistory(false),
        error: (error: unknown) => this.historyErrorState.set(errorMessage(error)),
      });
  }

  // Reloads after an action keep the current data on screen instead of flashing the loading state.
  private fetchGoal(showLoading: boolean): void {
    this.goalLoadingState.set(showLoading);
    this.waterTracking
      .getGoal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (goal) => {
          this.goalState.set(goal);
          this.goalErrorState.set(null);
          this.goalLoadingState.set(false);
        },
        error: (error: unknown) => {
          this.goalErrorState.set(errorMessage(error));
          this.goalLoadingState.set(false);
        },
      });
  }

  private fetchHistory(showLoading: boolean): void {
    this.historyLoadingState.set(showLoading);
    this.waterTracking
      .getHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          this.historyState.set(history);
          this.historyErrorState.set(null);
          this.historyLoadingState.set(false);
        },
        error: (error: unknown) => {
          this.historyErrorState.set(errorMessage(error));
          this.historyLoadingState.set(false);
        },
      });
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse || error instanceof Error) {
    return error.message;
  }
  return String(error);
}
