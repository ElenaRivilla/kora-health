import { Component, input } from '@angular/core';

let nextId = 0;

/**
 * Card with a title, an optional subtitle and the projected body. A control can be projected
 * into the header, next to the title, with the `appCardControl` attribute.
 */
@Component({
  selector: 'app-card',
  styleUrl: './card.component.scss',
  templateUrl: './card.component.html',
})
export class CardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();

  protected readonly titleId = `app-card-title-${nextId++}`;
}
