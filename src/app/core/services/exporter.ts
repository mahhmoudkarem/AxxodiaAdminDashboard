import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { saveBlob } from '../utils/format';

export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportColumn<T = any> {
  label: string;
  value: (row: T) => unknown;
  type?: 'text' | 'number' | 'money' | 'date';
}

export interface ExportRequest<T = any> {
  title: string; // shown at the top of the PDF / name of the Excel sheet
  fileName: string; // without extension
  columns: ExportColumn<T>[];
  rows: T[];
  subtitle?: string; // filters summary
}

const BRAND = { brown: '#594638', dark: '#302820', ivory: '#F7F4ED', beige: '#EAE5DA', taupe: '#B9A08B' };
const MAX_ROWS = 5000;

// Excel / PDF are built in the BROWSER from the data the dashboard already loads (no backend export).
// The libraries are loaded only when the user clicks export, so they do not slow down the dashboard.
@Service()
export class Exporter {
  private readonly document = inject(DOCUMENT);

  // Loads every page of a paged endpoint (max 100 per page in the API).
  async fetchAll<T>(page: (page: number, pageSize: number) => Observable<{ data: T[]; total: number }>, pageSize = 100): Promise<T[]> {
    const out: T[] = [];
    for (let p = 1; p <= Math.ceil(MAX_ROWS / pageSize); p++) {
      const res = await firstValueFrom(page(p, pageSize));
      out.push(...res.data);
      // stop on the last page (the API may also send fewer rows per page than asked)
      if (!res.data.length || out.length >= res.total) break;
    }
    return out.slice(0, MAX_ROWS);
  }

  async export<T>(format: ExportFormat, req: ExportRequest<T>): Promise<void> {
    const rows = req.rows.slice(0, MAX_ROWS);
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `${req.fileName}-${stamp}`;
    if (format === 'xlsx') await this.excel({ ...req, rows }, name);
    else await this.pdf({ ...req, rows }, name);
  }

  // ---------------------------------------------------------------- Excel
  private async excel<T>(req: ExportRequest<T>, name: string): Promise<void> {
    const mod: any = await import('exceljs');
    const ExcelJS = mod.default ?? mod;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Axxodia';
    wb.created = new Date();
    const ws = wb.addWorksheet(req.title.slice(0, 31).replace(/[\\/*?:[\]]/g, ' '), {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = req.columns.map((c) => ({ header: c.label, key: c.label, width: 14 }));
    for (const row of req.rows) {
      ws.addRow(req.columns.map((c) => this.cellValue(c, row, true)));
    }

    const header = ws.getRow(1);
    header.height = 22;
    header.eachCell((cell: any) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF594638' } };
      cell.alignment = { vertical: 'middle' };
    });
    req.columns.forEach((c, i) => {
      const col = ws.getColumn(i + 1);
      if (c.type === 'date') col.numFmt = 'dd mmm yyyy hh:mm';
      if (c.type === 'money') col.numFmt = '#,##0.00';
      let width = c.label.length;
      for (const row of req.rows.slice(0, 300)) width = Math.max(width, String(this.cellValue(c, row, false) ?? '').length);
      col.width = Math.min(45, Math.max(10, width + 2));
    });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: req.columns.length } };

    const buffer = await wb.xlsx.writeBuffer();
    saveBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${name}.xlsx`);
  }

  // ---------------------------------------------------------------- PDF
  // The table is drawn as HTML (so Arabic names show correctly) and every page is captured as an image.
  private async pdf<T>(req: ExportRequest<T>, name: string): Promise<void> {
    const [{ jsPDF }, h2c] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
    const html2canvas: any = (h2c as any).default ?? h2c;

    const doc = this.document;
    const PAGE_W = 1123; // A4 landscape at 96 dpi
    const PAGE_H = 794;
    const host = doc.createElement('div');
    host.style.cssText = `position:fixed;left:-20000px;top:0;width:${PAGE_W}px;z-index:-1;`;
    doc.body.appendChild(host);

    try {
      const logo = await this.loadImage('images/brand/axxodia-logo.png');
      const pages: HTMLElement[] = [];
      let page = this.newPage(host, req, logo, PAGE_W, PAGE_H);
      let body = page.querySelector('tbody')!;
      pages.push(page);

      if (!req.rows.length) {
        const tr = doc.createElement('tr');
        tr.innerHTML = `<td colspan="${req.columns.length}" style="padding:24px;text-align:center;color:#999">No data</td>`;
        body.appendChild(tr);
      }

      for (const row of req.rows) {
        const tr = this.rowElement(req, row);
        body.appendChild(tr);
        if (page.scrollHeight > PAGE_H && body.children.length > 1) {
          body.removeChild(tr);
          page = this.newPage(host, req, logo, PAGE_W, PAGE_H);
          body = page.querySelector('tbody')!;
          pages.push(page);
          body.appendChild(tr);
        }
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < pages.length; i++) {
        const footer = pages[i]!.querySelector('[data-page]') as HTMLElement;
        footer.textContent = `Page ${i + 1} / ${pages.length}`;
        const canvas = await html2canvas(pages[i]!, { scale: 1.4, backgroundColor: '#ffffff', logging: false, useCORS: true });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 297, 210);
      }
      pdf.save(`${name}.pdf`);
    } finally {
      host.remove();
    }
  }

  private newPage<T>(host: HTMLElement, req: ExportRequest<T>, logo: string | null, w: number, h: number): HTMLElement {
    const doc = this.document;
    const page = doc.createElement('div');
    page.style.cssText = `width:${w}px;height:${h}px;box-sizing:border-box;padding:28px 34px 40px;background:#fff;position:relative;overflow:hidden;font-family:Lato,Arial,sans-serif;color:${BRAND.dark};`;
    const header = doc.createElement('div');
    header.style.cssText = `display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${BRAND.taupe};padding-bottom:12px;margin-bottom:14px;`;
    const left = doc.createElement('div');
    const title = doc.createElement('div');
    title.textContent = req.title;
    title.style.cssText = `font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;color:${BRAND.brown};`;
    const sub = doc.createElement('div');
    sub.textContent = `${req.subtitle ? req.subtitle + ' · ' : ''}${req.rows.length} row(s) · ${new Date().toLocaleString('en-GB')}`;
    sub.style.cssText = 'font-size:11px;color:#8a7f76;margin-top:2px;';
    left.append(title, sub);
    header.appendChild(left);
    if (logo) {
      const img = doc.createElement('img');
      img.src = logo;
      img.style.cssText = 'height:46px;width:auto;';
      header.appendChild(img);
    }
    const table = doc.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;';
    const thead = doc.createElement('thead');
    const htr = doc.createElement('tr');
    for (const c of req.columns) {
      const th = doc.createElement('th');
      th.textContent = c.label;
      th.style.cssText = `background:${BRAND.brown};color:#fff;text-align:left;padding:7px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;`;
      htr.appendChild(th);
    }
    thead.appendChild(htr);
    table.append(thead, doc.createElement('tbody'));
    const footer = doc.createElement('div');
    footer.setAttribute('data-page', '');
    footer.style.cssText = 'position:absolute;bottom:14px;right:34px;font-size:10px;color:#8a7f76;';
    const brand = doc.createElement('div');
    brand.textContent = 'Axxodia · Management Portal';
    brand.style.cssText = 'position:absolute;bottom:14px;left:34px;font-size:10px;color:#8a7f76;';
    page.append(header, table, footer, brand);
    host.appendChild(page);
    // the footer area must stay free: measure against the page minus the footer
    page.style.height = 'auto';
    page.style.minHeight = `${h}px`;
    page.style.paddingBottom = '48px';
    return page;
  }

  private rowElement<T>(req: ExportRequest<T>, row: T): HTMLTableRowElement {
    const tr = this.document.createElement('tr');
    req.columns.forEach((c) => {
      const td = this.document.createElement('td');
      td.textContent = String(this.cellValue(c, row, false) ?? '—');
      td.dir = 'auto';
      td.style.cssText = `padding:6px 8px;border-bottom:1px solid ${BRAND.beige};vertical-align:top;${c.type === 'number' || c.type === 'money' ? 'text-align:right;' : ''}`;
      tr.appendChild(td);
    });
    return tr;
  }

  // Excel: real numbers / dates. PDF + widths: readable text.
  private cellValue<T>(c: ExportColumn<T>, row: T, forExcel: boolean): unknown {
    const v = c.value(row);
    if (v === null || v === undefined || v === '') return forExcel ? null : '';
    if (c.type === 'date') {
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return String(v);
      // Excel has no time zones: write the local (Cairo) time the user sees in the dashboard
      return forExcel ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000) : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (c.type === 'number' || c.type === 'money') {
      const n = Number(v);
      if (isNaN(n)) return String(v);
      return forExcel ? n : c.type === 'money' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString('en-US');
    }
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }

  private loadImage(src: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = this.document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d')!.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
}
