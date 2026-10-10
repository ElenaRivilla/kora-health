import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { WaterTrackingService } from '../../../../services/water-tracking.service';
import { WaterEntryRs } from '../../../../shared/entities/DTOS/water-tracking/water-entry-rs';
import { WaterGoalRs } from '../../../../shared/entities/DTOS/water-tracking/water-goal-rs';
import { WaterHistoryDayRs } from '../../../../shared/entities/DTOS/water-tracking/water-history-day-rs';
import { WaterTrackingStateService } from './water-tracking-state.service';

/** Data service double: every call hands back a subject the test resolves when it wants. */
class FakeWaterTrackingService {
  readonly goalRequests: Subject<WaterGoalRs | null>[] = [];
  readonly historyRequests: Subject<WaterHistoryDayRs[]>[] = [];
  readonly setGoalRequests: { dailyGoalMl: number; response: Subject<WaterGoalRs> }[] = [];
  readonly logEntryRequests: { amountMl: number; response: Subject<WaterEntryRs> }[] = [];

  getGoal(): Observable<WaterGoalRs | null> {
    const response = new Subject<WaterGoalRs | null>();
    this.goalRequests.push(response);
    return response;
  }

  getHistory(): Observable<WaterHistoryDayRs[]> {
    const response = new Subject<WaterHistoryDayRs[]>();
    this.historyRequests.push(response);
    return response;
  }

  setGoal(dailyGoalMl: number): Observable<WaterGoalRs> {
    const response = new Subject<WaterGoalRs>();
    this.setGoalRequests.push({ dailyGoalMl, response });
    return response;
  }

  logEntry(amountMl: number): Observable<WaterEntryRs> {
    const response = new Subject<WaterEntryRs>();
    this.logEntryRequests.push({ amountMl, response });
    return response;
  }
}

const GOAL: WaterGoalRs = { dailyGoalMl: 2000, dateUpdated: '2026-10-10T08:00:00Z' };
const HISTORY: WaterHistoryDayRs[] = [{ date: '2026-10-10', totalMl: 250, goalMl: 2000 }];
const ENTRY: WaterEntryRs = { id: 1, amountMl: 250, dateCreated: '2026-10-10T08:00:00Z' };

describe('WaterTrackingStateService', () => {
  let api: FakeWaterTrackingService;
  let state: WaterTrackingStateService;

  beforeEach(() => {
    api = new FakeWaterTrackingService();
    TestBed.configureTestingModule({
      providers: [WaterTrackingStateService, { provide: WaterTrackingService, useValue: api }],
    });
    state = TestBed.inject(WaterTrackingStateService);
  });

  function resolveInitialLoad(): void {
    api.goalRequests[0].next(GOAL);
    api.historyRequests[0].next(HISTORY);
  }

  it('should load the goal and the history on creation, going through the loading state', () => {
    expect(api.goalRequests.length).toBe(1);
    expect(api.historyRequests.length).toBe(1);
    expect(state.goalLoading()).toBe(true);
    expect(state.historyLoading()).toBe(true);

    resolveInitialLoad();

    expect(state.goal()).toEqual(GOAL);
    expect(state.goalLoading()).toBe(false);
    expect(state.goalError()).toBeNull();
    expect(state.history()).toEqual(HISTORY);
    expect(state.historyLoading()).toBe(false);
    expect(state.historyError()).toBeNull();
  });

  it('should keep a missing goal as null without reporting an error', () => {
    api.goalRequests[0].next(null);

    expect(state.goal()).toBeNull();
    expect(state.goalError()).toBeNull();
    expect(state.goalLoading()).toBe(false);
  });

  it('should expose the error state of each load independently', () => {
    api.goalRequests[0].error(new Error('goal failed'));

    expect(state.goalError()).toBe('goal failed');
    expect(state.goalLoading()).toBe(false);
    expect(state.historyError()).toBeNull();
    expect(state.historyLoading()).toBe(true);

    api.historyRequests[0].error(new Error('history failed'));

    expect(state.historyError()).toBe('history failed');
    expect(state.historyLoading()).toBe(false);
  });

  it('should reload only the history after logging an entry', () => {
    resolveInitialLoad();

    state.logEntry(250);
    expect(api.logEntryRequests[0].amountMl).toBe(250);
    expect(api.historyRequests.length).toBe(1);

    api.logEntryRequests[0].response.next(ENTRY);
    expect(api.historyRequests.length).toBe(2);
    expect(api.goalRequests.length).toBe(1);
    expect(state.history()).toEqual(HISTORY);

    const updated: WaterHistoryDayRs[] = [{ date: '2026-10-10', totalMl: 500, goalMl: 2000 }];
    api.historyRequests[1].next(updated);
    expect(state.history()).toEqual(updated);
  });

  it('should reload the goal and the history after saving a goal', () => {
    resolveInitialLoad();

    state.setGoal(2500);
    expect(api.setGoalRequests[0].dailyGoalMl).toBe(2500);

    const savedGoal: WaterGoalRs = { dailyGoalMl: 2500, dateUpdated: '2026-10-10T09:00:00Z' };
    api.setGoalRequests[0].response.next(savedGoal);
    expect(api.goalRequests.length).toBe(2);
    expect(api.historyRequests.length).toBe(2);

    const updatedHistory: WaterHistoryDayRs[] = [
      { date: '2026-10-10', totalMl: 250, goalMl: 2500 },
    ];
    api.goalRequests[1].next(savedGoal);
    api.historyRequests[1].next(updatedHistory);
    expect(state.goal()).toEqual(savedGoal);
    expect(state.history()).toEqual(updatedHistory);
  });

  it('should report a failed action on the state it affects, without reloading', () => {
    resolveInitialLoad();

    state.setGoal(2500);
    api.setGoalRequests[0].response.error(new Error('save failed'));
    expect(state.goalError()).toBe('save failed');
    expect(api.goalRequests.length).toBe(1);

    state.logEntry(100);
    api.logEntryRequests[0].response.error(new Error('log failed'));
    expect(state.historyError()).toBe('log failed');
    expect(api.historyRequests.length).toBe(1);
  });
});
