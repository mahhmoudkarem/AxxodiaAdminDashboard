import { Component, input, model, OnDestroy, output } from '@angular/core';

// Debounced search box: [(value)] updates immediately, (search) fires 350 ms after typing stops.
@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.html',
})
export class SearchInput implements OnDestroy {
  readonly value = model('');
  readonly placeholder = input('Search...');
  readonly search = output<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  onInput(v: string): void {
    this.value.set(v);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search.emit(v.trim()), 350);
  }

  clear(): void {
    this.value.set('');
    this.search.emit('');
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
