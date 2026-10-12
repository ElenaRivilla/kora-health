import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const THEME_ATTRIBUTE = 'data-theme';
const ACCENT_ATTRIBUTE = 'data-accent';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Reflects and writes the theme attributes of the root element (`data-theme`, `data-accent`).
 * The CSS works without this service: the attributes are the source of truth, and the default
 * theme follows the system through a media query. Nothing is persisted.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly root = this.document.documentElement;
  private readonly darkQuery = this.document.defaultView?.matchMedia?.(DARK_QUERY) ?? null;

  private readonly systemDark = signal(this.darkQuery?.matches ?? false);
  private readonly preferenceState = signal<ThemePreference>(this.readPreference());
  private readonly accentState = signal<string | null>(this.root.getAttribute(ACCENT_ATTRIBUTE));
  private readonly revisionState = signal(0);

  // Original content of the `theme-color` tags, restored when going back to the system theme.
  private readonly themeColorTags = Array.from(
    this.document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
  ).map((tag) => ({ tag, content: tag.content }));

  /** What `data-theme` says; `'system'` when it is absent. */
  readonly preference = this.preferenceState.asReadonly();

  /** Effective theme: the forced one or, otherwise, the system's. */
  readonly theme = computed<Theme>(() => {
    const preference = this.preferenceState();
    if (preference !== 'system') {
      return preference;
    }
    return this.systemDark() ? 'dark' : 'light';
  });

  /** Identifier in `data-accent`; `null` is the default accent. */
  readonly accent = this.accentState.asReadonly();

  /** Increases every time a computed colour may have changed. Read it to repaint. */
  readonly revision = this.revisionState.asReadonly();

  constructor() {
    const observer = new MutationObserver(() => this.syncFromRoot());
    observer.observe(this.root, {
      attributes: true,
      attributeFilter: [THEME_ATTRIBUTE, ACCENT_ATTRIBUTE, 'style'],
    });

    const onSystemChange = (event: MediaQueryListEvent) => {
      this.systemDark.set(event.matches);
      this.bumpRevision();
    };
    this.darkQuery?.addEventListener('change', onSystemChange);

    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
      this.darkQuery?.removeEventListener('change', onSystemChange);
    });
  }

  setPreference(preference: ThemePreference): void {
    if (preference === 'system') {
      this.root.removeAttribute(THEME_ATTRIBUTE);
      for (const { tag, content } of this.themeColorTags) {
        tag.content = content;
      }
    } else {
      this.root.setAttribute(THEME_ATTRIBUTE, preference);
      const background = getComputedStyle(this.root).getPropertyValue('--color-bg').trim();
      for (const { tag } of this.themeColorTags) {
        tag.content = background;
      }
    }
    this.preferenceState.set(preference);
  }

  setAccent(accent: string | null): void {
    if (accent === null) {
      this.root.removeAttribute(ACCENT_ATTRIBUTE);
    } else {
      this.root.setAttribute(ACCENT_ATTRIBUTE, accent);
    }
    this.accentState.set(accent);
  }

  private syncFromRoot(): void {
    this.preferenceState.set(this.readPreference());
    this.accentState.set(this.root.getAttribute(ACCENT_ATTRIBUTE));
    this.bumpRevision();
  }

  private bumpRevision(): void {
    this.revisionState.update((revision) => revision + 1);
  }

  private readPreference(): ThemePreference {
    const value = this.root.getAttribute(THEME_ATTRIBUTE);
    return value === 'light' || value === 'dark' ? value : 'system';
  }
}
