import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { map } from 'rxjs';
import { LocationListItem, ReportKey, ReportQuery, ReportResponse } from '../../../../core/models';
import { ExportColumn, Exporter } from '../../../../core/services/exporter';
import { dateInputToIso, humanize } from '../../../../core/utils/format';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { ReportsApi } from '../../services/reports-api';

interface ReportDef {
  key: ReportKey;
  label: string;
  icon: string;
}

// ReportsController: one tab per report. Excel / PDF are built in the browser from the report rows.
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, ExportButtons, HumanizePipe, DatePipe, DecimalPipe],
  selector: 'app-reports',
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private readonly api = inject(ReportsApi);
  private readonly catalog = inject(CatalogApi);
  private readonly exporter = inject(Exporter);
  readonly auth = inject(Auth);
  readonly canExport = computed(() => this.auth.hasPermission(P.reports.export));

  readonly reports: ReportDef[] = [
    { key: 'reservations', label: 'Reservations', icon: 'fa-calendar-check' },
    { key: 'customers', label: 'Customers', icon: 'fa-users' },
    { key: 'housekeeping', label: 'Housekeeping', icon: 'fa-broom' },
    { key: 'maintenance', label: 'Maintenance', icon: 'fa-screwdriver-wrench' },
    { key: 'employees', label: 'Employee performance', icon: 'fa-id-badge' },
    { key: 'paid-services', label: 'Paid services', icon: 'fa-bell-concierge' },
    { key: 'payments', label: 'Payments', icon: 'fa-credit-card' },
    { key: 'offers', label: 'Offers', icon: 'fa-tags' },
  ];

  readonly active = signal<ReportKey>('reservations');
  readonly result = signal<ReportResponse<Record<string, unknown>> | null>(null);
  readonly loading = signal(true);
  readonly locations = signal<LocationListItem[]>([]);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly filters = signal({ from: '', to: '', locationId: '', status: '', search: '' });

  readonly columns = computed(() => {
    const first = this.result()?.data?.[0];
    return first ? Object.keys(first) : [];
  });
  readonly activeLabel = computed(() => this.reports.find((r) => r.key === this.active())?.label ?? 'Report');
  readonly exportColumns = computed<ExportColumn<Record<string, unknown>>[]>(() =>
    this.columns().map((col) => {
      const sample = this.result()?.data?.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
      const k = this.kind(col, sample);
      return {
        label: this.header(col),
        value: (row: Record<string, unknown>) => row[col],
        type: k === 'date' ? 'date' : k === 'money' ? 'money' : typeof sample === 'number' ? 'number' : 'text',
      } as ExportColumn<Record<string, unknown>>;
    }),
  );
  readonly exportSubtitle = computed(() => {
    const f = this.filters();
    return [f.from && `From ${f.from}`, f.to && `to ${f.to}`, f.status && `Status: ${f.status}`, f.search && `Search: ${f.search}`].filter(Boolean).join(' ');
  });
  // all the rows of the report with the current filters
  readonly loadAll = () =>
    this.exporter.fetchAll((page, pageSize) =>
      this.api.get(this.active(), { ...this.query(), page, pageSize }).pipe(map((r) => ({ data: r.data, total: r.meta?.total_count ?? r.data.length }))),
    );

  readonly summary = computed(() => Object.entries(this.result()?.summary ?? {}));
  readonly chart = computed(() => {
    const s = this.result()?.chart?.[0];
    if (!s || !s.values.length) return null;
    const max = Math.max(1, ...s.values);
    return { name: s.name, bars: s.labels.map((l, i) => ({ label: l, value: s.values[i] ?? 0, pct: Math.round(((s.values[i] ?? 0) / max) * 100) })) };
  });

  ngOnInit(): void {
    this.catalog.allLocations().subscribe({ next: (r) => this.locations.set(r.data), error: () => {} });
    // default period: the last 30 days
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 86_400_000);
    this.filters.set({ ...this.filters(), from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
    this.load();
  }

  private query(): ReportQuery {
    const f = this.filters();
    return {
      from: dateInputToIso(f.from),
      to: dateInputToIso(f.to, true),
      locationId: f.locationId ? Number(f.locationId) : null,
      status: f.status || null,
      search: f.search || null,
      page: this.page(),
      pageSize: this.pageSize,
    };
  }

  select(key: ReportKey): void {
    this.active.set(key);
    this.page.set(1);
    this.result.set(null);
    this.load();
  }

  set(key: string, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get(this.active(), this.query()).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }


  // How to show a cell
  kind(col: string, value: unknown): 'date' | 'status' | 'money' | 'bool' | 'text' {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean' || col.startsWith('is_')) return 'bool';
    if (col === 'status') return 'status';
    if (/(_at|_date|^check_in|^check_out)$/.test(col) && typeof value === 'string') return 'date';
    if (/(amount|total|price|fee)/.test(col) && typeof value === 'number') return 'money';
    return 'text';
  }

  header(col: string): string {
    return humanize(col.replace(/_id$/, ' #'));
  }

  asString(v: unknown): string {
    return v === null || v === undefined || v === '' ? '—' : String(v);
  }
}
