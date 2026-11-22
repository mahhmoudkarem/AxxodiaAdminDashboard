import { Component, computed, input } from '@angular/core';
import { humanize } from '../../../core/utils/format';

const GREEN = ['active', 'available', 'completed', 'checkedin', 'paid', 'online', 'true', 'published', 'done', 'accepted', 'working'];
const AMBER = ['upcoming', 'pending', 'pendingcompletion', 'assigned', 'awaitingpayment', 'awaitingcustomerapproval', 'inprogress', 'busy', 'new', 'unassigned', 'received', 'away'];
const RED = ['cancelled', 'rejected', 'failed', 'outofservice', 'inactive', 'false', 'disabled', 'closed', 'expired', 'overdue'];
const BLUE = ['checkedout', 'refunded', 'notrequired', 'offline'];

@Component({
  selector: 'app-status-badge',
  template: `<span class="chip {{ cls() }}"><span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>{{ text() }}</span>`,
})
export class StatusBadge {
  readonly status = input<string | boolean | null | undefined>('');
  readonly label = input<string | null>(null);

  readonly text = computed(() => {
    if (this.label()) return this.label()!;
    const s = this.status();
    if (typeof s === 'boolean') return s ? 'Active' : 'Inactive';
    return humanize(s ?? '');
  });

  readonly cls = computed(() => {
    const key = String(this.status() ?? '').toLowerCase().replace(/[^a-z]/g, '');
    if (GREEN.includes(key)) return 'bg-success/12 text-success';
    if (AMBER.includes(key)) return 'bg-warning/15 text-warning';
    if (RED.includes(key)) return 'bg-danger/12 text-danger';
    if (BLUE.includes(key)) return 'bg-info/12 text-info';
    return 'bg-brand-beige text-brand-brown';
  });
}
