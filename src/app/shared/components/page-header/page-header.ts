import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input('');
  // Optional "back" link
  readonly backLink = input<string | unknown[] | null>(null);
}
