import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly total = input(0);
  readonly pageChange = output<number>();

  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
  readonly from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly to = computed(() => Math.min(this.total(), this.page() * this.pageSize()));

  go(p: number): void {
    if (p < 1 || p > this.pages() || p === this.page()) return;
    this.pageChange.emit(p);
  }
}
