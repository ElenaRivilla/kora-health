import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { AppConfigService } from '../shared/config/app-config.service';

export const REQUEST_TIMEOUT_MS = 10_000;

export type QueryParams = Record<string, string | number | boolean>;

/** Base class for the data services: builds the API URL and applies the request timeout. */
export abstract class BaseHttpService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  protected get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), { params }).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  protected put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  protected post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  private buildUrl(path: string): string {
    const base = this.appConfig.apiBaseUrl.replace(/\/+$/, '');
    const relative = path.replace(/^\/+/, '');
    return `${base}/${relative}`;
  }
}
