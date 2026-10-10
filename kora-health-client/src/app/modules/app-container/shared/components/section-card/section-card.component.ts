import { Component, input } from '@angular/core';

/** Card with a title and projected content; wraps each section of a page. */
@Component({
  selector: 'app-section-card',
  styleUrl: './section-card.component.scss',
  templateUrl: './section-card.component.html',
})
export class SectionCardComponent {
  readonly title = input.required<string>();
}
