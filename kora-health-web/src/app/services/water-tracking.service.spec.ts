import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../shared/config/app-config.service';
import { WaterEntryRs } from '../shared/entities/DTOS/water-tracking/water-entry-rs';
import { WaterGoalRs } from '../shared/entities/DTOS/water-tracking/water-goal-rs';
import { WaterHistoryDayRs } from '../shared/entities/DTOS/water-tracking/water-history-day-rs';
import { WaterTrackingService } from './water-tracking.service';

const API = 'http://localhost:5001/api/water-tracking';

describe('WaterTrackingService', () => {
  let service: WaterTrackingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: { apiBaseUrl: 'http://localhost:5001' } },
      ],
    });
    service = TestBed.inject(WaterTrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should read the goal with GET /goal', () => {
    const goal: WaterGoalRs = { dailyGoalMl: 2000, dateUpdated: '2026-10-10T08:00:00Z' };
    let result: WaterGoalRs | null | undefined;
    service.getGoal().subscribe((value) => (result = value));

    const request = httpMock.expectOne(`${API}/goal`);
    expect(request.request.method).toBe('GET');
    request.flush(goal);

    expect(result).toEqual(goal);
  });

  it('should translate a 404 on the goal into null', () => {
    let result: WaterGoalRs | null | undefined;
    service.getGoal().subscribe((value) => (result = value));

    httpMock.expectOne(`${API}/goal`).flush(null, { status: 404, statusText: 'Not Found' });

    expect(result).toBeNull();
  });

  it('should propagate goal errors other than 404', () => {
    let error: unknown;
    service.getGoal().subscribe({ error: (err: unknown) => (error = err) });

    httpMock.expectOne(`${API}/goal`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
  });

  it('should save the goal with PUT /goal', () => {
    const goal: WaterGoalRs = { dailyGoalMl: 2500, dateUpdated: '2026-10-10T08:00:00Z' };
    let result: WaterGoalRs | undefined;
    service.setGoal(2500).subscribe((value) => (result = value));

    const request = httpMock.expectOne(`${API}/goal`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ dailyGoalMl: 2500 });
    request.flush(goal);

    expect(result).toEqual(goal);
  });

  it('should log an entry with POST /entries', () => {
    const entry: WaterEntryRs = { id: 7, amountMl: 250, dateCreated: '2026-10-10T08:00:00Z' };
    let result: WaterEntryRs | undefined;
    service.logEntry(250).subscribe((value) => (result = value));

    const request = httpMock.expectOne(`${API}/entries`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ amountMl: 250 });
    request.flush(entry);

    expect(result).toEqual(entry);
  });

  it('should read the history with GET /history, asking for 30 days by default', () => {
    const history: WaterHistoryDayRs[] = [{ date: '2026-10-10', totalMl: 750, goalMl: 2000 }];
    let result: WaterHistoryDayRs[] | undefined;
    service.getHistory().subscribe((value) => (result = value));

    const request = httpMock.expectOne(`${API}/history?days=30`);
    expect(request.request.method).toBe('GET');
    request.flush(history);

    expect(result).toEqual(history);
  });

  it('should ask for the requested number of history days', () => {
    service.getHistory(7).subscribe();

    httpMock.expectOne(`${API}/history?days=7`).flush([]);
  });
});
