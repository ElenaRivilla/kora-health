import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/** Stand-in for `matchMedia('(prefers-color-scheme: dark)')`, which jsdom does not implement. */
class FakeDarkQuery {
  private readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(public matches: boolean) {}

  addEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.delete(listener);
  }

  /** Simulates the system switching theme while the app is open. */
  change(matches: boolean): void {
    this.matches = matches;
    for (const listener of this.listeners) {
      listener({ matches } as MediaQueryListEvent);
    }
  }
}

// MutationObserver notifications arrive as a microtask; a macrotask waits for them.
const flushMutations = () => new Promise((resolve) => setTimeout(resolve));

describe('ThemeService', () => {
  const root = document.documentElement;
  let themeColorTags: HTMLMetaElement[];
  let backgroundStyle: HTMLStyleElement;

  function useSystemTheme(theme: 'light' | 'dark' | 'none'): FakeDarkQuery | null {
    if (theme === 'none') {
      return null;
    }
    const query = new FakeDarkQuery(theme === 'dark');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => query,
    });
    return query;
  }

  beforeEach(() => {
    themeColorTags = ['light-background', 'dark-background'].map((content) => {
      const tag = document.createElement('meta');
      tag.name = 'theme-color';
      tag.content = content;
      document.head.append(tag);
      return tag;
    });
    backgroundStyle = document.createElement('style');
    backgroundStyle.textContent = ':root { --color-bg: forced-background; }';
    document.head.append(backgroundStyle);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete (window as { matchMedia?: unknown }).matchMedia;
    themeColorTags.forEach((tag) => tag.remove());
    backgroundStyle.remove();
    root.removeAttribute('data-theme');
    root.removeAttribute('data-accent');
    root.removeAttribute('style');
  });

  it('should start following the system, with the default accent', () => {
    useSystemTheme('light');
    const service = TestBed.inject(ThemeService);

    expect(service.preference()).toBe('system');
    expect(service.accent()).toBeNull();
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('should report the system theme as the effective theme', () => {
    useSystemTheme('dark');
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');

    TestBed.resetTestingModule();
    useSystemTheme('light');
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('should take the system theme as light when matchMedia is not available', () => {
    useSystemTheme('none');
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('should follow the system when it changes theme with the app open', () => {
    const query = useSystemTheme('light')!;
    const service = TestBed.inject(ThemeService);
    const revision = service.revision();

    query.change(true);

    expect(service.theme()).toBe('dark');
    expect(service.revision()).toBeGreaterThan(revision);
  });

  it('should bump the revision when data-theme, data-accent or the root style change from outside', async () => {
    useSystemTheme('light');
    const service = TestBed.inject(ThemeService);

    let revision = service.revision();
    root.setAttribute('data-theme', 'dark');
    await flushMutations();
    expect(service.revision()).toBeGreaterThan(revision);
    expect(service.preference()).toBe('dark');
    expect(service.theme()).toBe('dark');

    revision = service.revision();
    root.setAttribute('data-accent', 'indigo');
    await flushMutations();
    expect(service.revision()).toBeGreaterThan(revision);
    expect(service.accent()).toBe('indigo');

    revision = service.revision();
    root.style.setProperty('--accent', 'other-accent');
    await flushMutations();
    expect(service.revision()).toBeGreaterThan(revision);
  });

  it('should force a theme and restore the system one with setPreference', () => {
    useSystemTheme('light');
    const service = TestBed.inject(ThemeService);

    service.setPreference('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(service.preference()).toBe('dark');
    expect(service.theme()).toBe('dark');
    expect(themeColorTags.map((tag) => tag.content)).toEqual(['forced-background', 'forced-background']);

    service.setPreference('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(service.theme()).toBe('light');

    service.setPreference('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(service.preference()).toBe('system');
    expect(themeColorTags.map((tag) => tag.content)).toEqual(['light-background', 'dark-background']);
  });

  it('should set and remove data-accent with setAccent', () => {
    useSystemTheme('light');
    const service = TestBed.inject(ThemeService);

    service.setAccent('indigo');
    expect(root.getAttribute('data-accent')).toBe('indigo');
    expect(service.accent()).toBe('indigo');

    service.setAccent(null);
    expect(root.hasAttribute('data-accent')).toBe(false);
    expect(service.accent()).toBeNull();
  });
});
