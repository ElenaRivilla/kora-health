import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { AppConfigService } from '../shared/config/app-config.service';
import { BaseHttpService } from './base-http.service';

@Injectable()
class TestHttpService extends BaseHttpService {
  read(path: string, days?: number): Observable<unknown> {
    return this.get<unknown>(path, days === undefined ? undefined : { days });
  }

  replace(path: string, body: unknown): Observable<unknown> {
    return this.put<unknown>(path, body);
  }

  create(path: string, body: unknown): Observable<unknown> {
    return this.post<unknown>(path, body);
  }
}

describe('BaseHttpService', () => {
  let service: TestHttpService;
  let httpMock: HttpTestingController;
  let apiBaseUrl: string;

  beforeEach(() => {
    apiBaseUrl = 'http://localhost:5001';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestHttpService,
        {
          provide: AppConfigService,
          useValue: {
            get apiBaseUrl() {
              return apiBaseUrl;
            },
          },
        },
      ],
    });
    service = TestBed.inject(TestHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should compose the URL from apiBaseUrl and the relative path', () => {
    service.read('api/water-tracking/goal').subscribe();

    const request = httpMock.expectOne('http://localhost:5001/api/water-tracking/goal');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('should not duplicate slashes between apiBaseUrl and the path', () => {
    apiBaseUrl = 'http://localhost:5001/';
    service.read('/api/water-tracking/goal').subscribe();

    httpMock.expectOne('http://localhost:5001/api/water-tracking/goal').flush({});
  });

  it('should send query parameters on reads', () => {
    service.read('api/water-tracking/history', 30).subscribe();

    const request = httpMock.expectOne('http://localhost:5001/api/water-tracking/history?days=30');
    expect(request.request.params.get('days')).toBe('30');
    request.flush([]);
  });

  it('should send the body on PUT and POST without authentication headers', () => {
    service.replace('api/water-tracking/goal', { dailyGoalMl: 2000 }).subscribe();
    const put = httpMock.expectOne('http://localhost:5001/api/water-tracking/goal');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ dailyGoalMl: 2000 });
    expect(put.request.headers.has('Authorization')).toBe(false);
    put.flush({});

    service.create('api/water-tracking/entries', { amountMl: 250 }).subscribe();
    const post = httpMock.expectOne('http://localhost:5001/api/water-tracking/entries');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ amountMl: 250 });
    post.flush({});
  });
});
