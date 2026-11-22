import { HttpContext } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { SILENT_ERROR } from '../../../core/http/http-context';
import { Api } from '../../../core/services/api';
import { ChatMessage, ConversationDetail, ConversationListItem, ConversationTab, PagedResult } from '../../../core/models';

// AdminChatController  ->  /admin/chat   (READ ONLY oversight)
@Service()
export class ChatApi {
  private readonly api = inject(Api);

  conversations(q: { tab?: ConversationTab; q?: string; page?: number; page_size?: number }, silent = false) {
    return this.api.get<PagedResult<ConversationListItem>>(
      'admin/chat/conversations',
      q,
      silent ? new HttpContext().set(SILENT_ERROR, true) : undefined,
    );
  }
  conversation(id: number) {
    return this.api.get<ConversationDetail>(`admin/chat/conversations/${id}`);
  }
  messages(id: number, q: { before_id?: number | null; after_id?: number | null; limit?: number } = {}, silent = false) {
    return this.api.get<ChatMessage[]>(
      `admin/chat/conversations/${id}/messages`,
      q,
      silent ? new HttpContext().set(SILENT_ERROR, true) : undefined,
    );
  }
}
