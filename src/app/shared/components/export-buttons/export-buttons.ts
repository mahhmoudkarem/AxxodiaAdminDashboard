import { Component, inject, input, signal } from '@angular/core';
import { ExportColumn, Exporter, ExportFormat } from '../../../core/services/exporter';
import { Toast } from '../../../core/services/toast';

// "Excel" + "PDF" buttons. The page gives the columns and a function that loads ALL the rows
// (with the current filters); the file is built in the browser.
@Component({
  selector: 'app-export-buttons',
  template: `
    <div class="inline-flex shrink-0 overflow-hidden rounded-xl border border-brand-beige bg-white">
      <button type="button" class="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-brand-brown transition hover:bg-brand-ivory disabled:opacity-50" (click)="run('xlsx')" [disabled]="!!busy()">
        <i class="fa-solid" [class.fa-file-excel]="busy() !== 'xlsx'" [class.text-success]="busy() !== 'xlsx'" [class.fa-circle-notch]="busy() === 'xlsx'" [class.fa-spin]="busy() === 'xlsx'"></i>
        Excel
      </button>
      <span class="w-px bg-brand-beige"></span>
      <button type="button" class="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-brand-brown transition hover:bg-brand-ivory disabled:opacity-50" (click)="run('pdf')" [disabled]="!!busy()">
        <i class="fa-solid" [class.fa-file-pdf]="busy() !== 'pdf'" [class.text-danger]="busy() !== 'pdf'" [class.fa-circle-notch]="busy() === 'pdf'" [class.fa-spin]="busy() === 'pdf'"></i>
        PDF
      </button>
    </div>
  `,
})
export class ExportButtons {
  private readonly exporter = inject(Exporter);
  private readonly toast = inject(Toast);

  readonly title = input.required<string>();
  readonly fileName = input.required<string>();
  readonly columns = input.required<ExportColumn[]>();
  readonly load = input.required<() => Promise<unknown[]>>();
  readonly subtitle = input<string>('');

  readonly busy = signal<ExportFormat | null>(null);

  async run(format: ExportFormat): Promise<void> {
    if (this.busy()) return;
    this.busy.set(format);
    try {
      const rows = await this.load()();
      if (!rows.length) {
        this.toast.info('There is nothing to export with these filters.');
        return;
      }
      await this.exporter.export(format, {
        title: this.title(),
        fileName: this.fileName(),
        columns: this.columns(),
        rows,
        subtitle: this.subtitle() || undefined,
      });
      this.toast.success(format === 'pdf' ? 'PDF downloaded.' : 'Excel file downloaded.');
    } catch (err) {
      // API errors are already shown by errorInterceptor
      const isApi = !!err && typeof err === 'object' && 'status' in err && 'code' in err;
      if (!isApi) this.toast.error('The file could not be created. Please try again.');
    } finally {
      this.busy.set(null);
    }
  }
}
