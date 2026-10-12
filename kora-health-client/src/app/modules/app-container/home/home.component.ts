import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import { HOME_DESTINATIONS, HOME_ICONS } from './home-destinations';

interface NavDestination {
  path: string;
  label: string;
  icon: string;
  activeIcon: string;
}

/** Application shell: header with the active section title, section navigation and content outlet. */
@Component({
  imports: [NgIcon, RouterLink, RouterLinkActive, RouterOutlet],
  providers: [provideIcons(HOME_ICONS)],
  selector: 'app-home',
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Labels come from the titles declared on the child routes, so they are written only once;
  // a destination may replace its title with a short label.
  protected readonly destinations: NavDestination[] = HOME_DESTINATIONS.flatMap((destination) => {
    const child = this.route.routeConfig?.children?.find((route) => route.path === destination.path);
    if (typeof child?.title !== 'string') {
      return [];
    }
    return [
      {
        path: destination.path,
        label: destination.shortLabel ?? child.title,
        icon: destination.icon,
        activeIcon: destination.activeIcon,
      },
    ];
  });

  protected readonly title = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activeSectionTitle()),
    ),
    { initialValue: this.activeSectionTitle() },
  );

  private activeSectionTitle(): string {
    return this.route.snapshot.firstChild?.title ?? '';
  }
}
