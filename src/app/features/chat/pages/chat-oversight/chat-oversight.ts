import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ChatMessage, ConversationDetail, ConversationListItem, ConversationTab } from '../../../../core/models';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ChatApi } from '../../services/chat-api';

// AdminChatController: READ ONLY monitoring of every conversation of every location.
// The admin cannot reply, assign or close from here (that is the customer service app).
@Component({
  imports: [PageHeader, SearchInput, StatusBadge, Loading, EmptyState, Pagination, DatePipe, UpperCasePipe],
  selector: 'app-chat-oversight',
  templateUrl: './chat-oversight.html',
})
export class ChatOversight implements OnInit {
  private readonly api = inject(ChatApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  readonly tab = signal<ConversationTab>('open');
  readonly q = signal('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly conversations = signal<ConversationListItem[]>([]);
  readonly loading = signal(true);

  readonly selectedId = signal<number | null>(null);
  readonly selected = signal<ConversationDetail | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly messagesLoading = signal(false);
  readonly hasOlder = signal(true);
  readonly loadingOlder = signal(false);

  readonly breached = computed(() => this.conversations().filter((c) => c.sla_breached).length);

  ngOnInit(): void {
    this.load();
    // Live view: refresh the list and the open conversation every 15 s.
    interval(15_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.load(true);
        this.pollNew();
      });
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    this.api.conversations({ tab: this.tab(), q: this.q() || undefined, page: this.page(), page_size: this.pageSize }, silent).subscribe({
      next: (res) => {
        this.conversations.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setTab(t: ConversationTab): void {
    this.tab.set(t);
    this.page.set(1);
    this.load();
  }

  search(q: string): void {
    this.q.set(q);
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  open(c: ConversationListItem): void {
    this.selectedId.set(c.id);
    this.selected.set(null);
    this.messages.set([]);
    this.hasOlder.set(true);
    this.messagesLoading.set(true);
    this.api.conversation(c.id).subscribe((d) => this.selected.set(d));
    this.api.messages(c.id, { limit: 50 }).subscribe({
      next: (list) => {
        this.messages.set(this.sort(list));
        this.hasOlder.set(list.length >= 50);
        this.messagesLoading.set(false);
        this.scrollToBottom();
      },
      error: () => this.messagesLoading.set(false),
    });
  }

  loadOlder(): void {
    const id = this.selectedId();
    const first = this.messages()[0];
    if (!id || !first) return;
    this.loadingOlder.set(true);
    this.api.messages(id, { before_id: first.id, limit: 50 }).subscribe({
      next: (list) => {
        this.messages.update((cur) => this.sort([...list, ...cur]));
        this.hasOlder.set(list.length >= 50);
        this.loadingOlder.set(false);
      },
      error: () => this.loadingOlder.set(false),
    });
  }

  private pollNew(): void {
    const id = this.selectedId();
    const last = this.messages().at(-1);
    if (!id || !last) return;
    this.api.messages(id, { after_id: last.id, limit: 100 }, true).subscribe((list) => {
      if (!list.length) return;
      this.messages.update((cur) => this.sort([...cur, ...list.filter((m) => !cur.some((x) => x.id === m.id))]));
      this.scrollToBottom();
    });
  }

  private sort(list: ChatMessage[]): ChatMessage[] {
    return [...list].sort((a, b) => a.id - b.id);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scroller()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  waitingMinutes(c: ConversationListItem): number | null {
    return c.waiting_since ? Math.max(0, Math.round((Date.now() - new Date(c.waiting_since).getTime()) / 60000)) : null;
  }
}
