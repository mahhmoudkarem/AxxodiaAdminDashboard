import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly title = input('Nothing here yet');
  readonly message = input('');
  readonly icon = input<string | null>(null);
}
