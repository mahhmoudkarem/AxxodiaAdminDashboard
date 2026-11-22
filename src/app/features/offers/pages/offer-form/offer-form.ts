import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { CustomerReportRow, OfferAudience, OfferDetails, OfferRequest } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';
import { isoToLocalInput, localInputToIso } from '../../../../core/utils/format';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { FileUrlPipe } from '../../../../shared/pipes/file-url-pipe';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { ReportsApi } from '../../../reports/services/reports-api';
import { OffersApi } from '../../services/offers-api';

export const COUNTRIES = [
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' },
  { code: 'SD', name: 'Sudan' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
];

@Component({
  imports: [ReactiveFormsModule, PageHeader, Loading, SearchInput, FileUrlPipe],
  selector: 'app-offer-form',
  templateUrl: './offer-form.html',
})
export class OfferForm implements OnInit {
  private readonly api = inject(OffersApi);
  private readonly catalog = inject(CatalogApi);
  private readonly reports = inject(ReportsApi);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);
  readonly countries = COUNTRIES;

  readonly id = input<string>();
  readonly offerId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isNew = computed(() => this.offerId() === null);
  readonly canSave = computed(() => this.auth.hasPermission(this.isNew() ? P.offers.create : P.offers.edit));
  readonly canSearchCustomers = computed(() => this.auth.hasPermission(P.reports.view));

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly details = signal<OfferDetails | null>(null);
  readonly audience = signal<OfferAudience>('AllCustomers');
  readonly customerIds = signal<number[]>([]);
  readonly customerNames = signal<Record<number, string>>({});
  readonly results = signal<CustomerReportRow[]>([]);
  readonly searching = signal(false);
  readonly imageUrl = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    discount_percentage: [10 as number | null, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    target_country: ['EG'],
  });

  ngOnInit(): void {
    if (!this.canSave()) this.form.disable();
    const id = this.offerId();
    if (id) {
      this.loading.set(true);
      this.api.get(id).subscribe({
        next: (o) => {
          this.details.set(o);
          this.form.patchValue({
            ...o,
            start_date: isoToLocalInput(o.start_date),
            end_date: isoToLocalInput(o.end_date),
            target_country: o.target_country ?? 'EG',
          });
          this.audience.set(o.audience);
          this.customerIds.set(o.customer_ids ?? []);
          this.imageUrl.set(o.image_url ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 14 * 86_400_000);
      this.form.patchValue({ start_date: isoToLocalInput(start.toISOString()), end_date: isoToLocalInput(end.toISOString()) });
    }
  }

  onImage(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('The image must be 5 MB or less.');
      return;
    }
    this.uploading.set(true);
    this.catalog.uploadMedia(file, 'offer').subscribe({
      next: (m) => {
        this.imageUrl.set(m.url);
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false),
    });
  }

  searchCustomers(q: string): void {
    if (!q) {
      this.results.set([]);
      return;
    }
    this.searching.set(true);
    this.reports.get<CustomerReportRow>('customers', { search: q, pageSize: 10 }).subscribe({
      next: (res) => {
        this.results.set(res.data);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }

  addCustomer(c: CustomerReportRow): void {
    this.customerNames.update((m) => ({ ...m, [c.customer_id]: c.full_name }));
    if (!this.customerIds().includes(c.customer_id)) this.customerIds.update((ids) => [...ids, c.customer_id]);
  }

  addCustomerId(raw: string): void {
    const ids = raw
      .split(/[\s,;]+/)
      .map((x) => Number(x))
      .filter((x) => Number.isInteger(x) && x > 0);
    this.customerIds.update((cur) => Array.from(new Set([...cur, ...ids])));
  }

  removeCustomer(id: number): void {
    this.customerIds.update((ids) => ids.filter((x) => x !== id));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete the required fields.');
      return;
    }
    const v = this.form.getRawValue();
    const start = localInputToIso(v.start_date)!;
    const end = localInputToIso(v.end_date)!;
    if (new Date(end) <= new Date(start)) {
      this.toast.warning('The end date must be after the start date.');
      return;
    }
    if (this.audience() === 'TargetedCustomers' && !this.customerIds().length) {
      this.toast.warning('Choose at least one customer.');
      return;
    }

    const dto: OfferRequest = {
      title: v.title!.trim(),
      description: v.description!.trim(),
      image_url: this.imageUrl(),
      discount_percentage: Number(v.discount_percentage),
      start_date: start,
      end_date: end,
      audience: this.audience(),
      customer_ids: this.audience() === 'TargetedCustomers' ? this.customerIds() : [],
      target_country: this.audience() === 'Country' ? (v.target_country || '').toUpperCase() : null,
    };

    this.saving.set(true);
    const id = this.offerId();
    const req = id ? this.api.update(id, dto) : this.api.create(dto);
    req.subscribe({
      next: (o) => {
        this.saving.set(false);
        this.toast.success(id ? 'Offer saved.' : 'Offer created. Publish it from the offers list when ready.');
        if (!id) void this.router.navigate(['/offers', o.id]);
        else this.details.set(o);
      },
      error: () => this.saving.set(false),
    });
  }
}
