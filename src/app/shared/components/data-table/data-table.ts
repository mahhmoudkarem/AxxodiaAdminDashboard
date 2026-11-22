import { Component, input, output } from '@angular/core';
import { EmptyState } from '../empty-state/empty-state';
import { Loading } from '../loading/loading';
import { Pagination } from '../pagination/pagination';

// Card wrapper for list pages: loading / empty states + optional pagination.
// Put a <table class="table"> inside.
@Component({
  selector: 'app-data-table',
  imports: [Loading, EmptyState, Pagination],
  templateUrl: './data-table.html',
})
export class DataTable {
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyTitle = input('No records found');
  readonly emptyMessage = input('Try changing the filters or add a new record.');
  readonly page = input<number | null>(null);
  readonly pageSize = input(20);
  readonly total = input(0);
  readonly pageChange = output<number>();
}
