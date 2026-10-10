import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG_URL, AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose apiBaseUrl once the config file is loaded', async () => {
    const loading = service.load();
    httpMock.expectOne(APP_CONFIG_URL).flush({ apiBaseUrl: 'http://localhost:5001' });
    await loading;

    expect(service.apiBaseUrl).toBe('http://localhost:5001');
  });

  it('should fail with a descriptive error when the config file is not available', async () => {
    const loading = service.load();
    httpMock.expectOne(APP_CONFIG_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });

    await expect(loading).rejects.toThrow('No se ha podido cargar la configuración');
    expect(() => service.apiBaseUrl).toThrow();
  });

  it('should fail with a descriptive error when the config has no apiBaseUrl', async () => {
    const loading = service.load();
    httpMock.expectOne(APP_CONFIG_URL).flush({});

    await expect(loading).rejects.toThrow('no contiene «apiBaseUrl»');
    expect(() => service.apiBaseUrl).toThrow();
  });
});
