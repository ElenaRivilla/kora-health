import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiBaseUrl: string;
}

export const APP_CONFIG_URL = 'assets/config.json';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private config: AppConfig | null = null;

  get apiBaseUrl(): string {
    if (!this.config) {
      throw new Error('La configuración de la aplicación todavía no se ha cargado.');
    }
    return this.config.apiBaseUrl;
  }

  async load(): Promise<void> {
    let loaded: Partial<AppConfig> | null;
    try {
      loaded = await firstValueFrom(this.http.get<Partial<AppConfig> | null>(APP_CONFIG_URL));
    } catch {
      throw new Error(`No se ha podido cargar la configuración de la aplicación (${APP_CONFIG_URL}).`);
    }

    const apiBaseUrl = loaded?.apiBaseUrl;
    if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim() === '') {
      throw new Error(`La configuración de la aplicación (${APP_CONFIG_URL}) no contiene «apiBaseUrl».`);
    }

    this.config = { apiBaseUrl };
  }
}
