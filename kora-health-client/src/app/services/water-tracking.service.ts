import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { LogWaterRq } from '../shared/entities/DTOS/water-tracking/log-water-rq';
import { SetWaterGoalRq } from '../shared/entities/DTOS/water-tracking/set-water-goal-rq';
import { WaterEntryRs } from '../shared/entities/DTOS/water-tracking/water-entry-rs';
import { WaterGoalRs } from '../shared/entities/DTOS/water-tracking/water-goal-rs';
import { WaterHistoryDayRs } from '../shared/entities/DTOS/water-tracking/water-history-day-rs';
import { BaseHttpService } from './base-http.service';

const BASE_PATH = 'api/water-tracking';

export const DEFAULT_HISTORY_DAYS = 30;

/** Data access for the water-tracking endpoints. Stateless: every call returns an observable. */
@Injectable({ providedIn: 'root' })
export class WaterTrackingService extends BaseHttpService {
  /** Emits `null` when the user has no goal yet (the API answers 404). */
  getGoal(): Observable<WaterGoalRs | null> {
    return this.get<WaterGoalRs>(`${BASE_PATH}/goal`).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }

  setGoal(dailyGoalMl: number): Observable<WaterGoalRs> {
    const body: SetWaterGoalRq = { dailyGoalMl };
    return this.put<WaterGoalRs>(`${BASE_PATH}/goal`, body);
  }

  logEntry(amountMl: number): Observable<WaterEntryRs> {
    const body: LogWaterRq = { amountMl };
    return this.post<WaterEntryRs>(`${BASE_PATH}/entries`, body);
  }

  getHistory(days = DEFAULT_HISTORY_DAYS): Observable<WaterHistoryDayRs[]> {
    return this.get<WaterHistoryDayRs[]>(`${BASE_PATH}/history`, { days });
  }
}
