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
import { filter, map } from 'rxjs';

interface NavDestination {
  path: string;
  label: string;
}

/** Application shell: header with the active section title, section navigation and content outlet. */
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-home',
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Labels come from the titles declared on the child routes, so they are written only once.
  protected readonly destinations: NavDestination[] = (
    this.route.routeConfig?.children ?? []
  ).flatMap((child) =>
    child.path && typeof child.title === 'string' ? [{ path: child.path, label: child.title }] : [],
  );

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
