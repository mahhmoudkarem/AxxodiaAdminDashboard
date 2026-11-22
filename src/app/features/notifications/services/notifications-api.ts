import { HttpContext } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { SILENT_ERROR } from '../../../core/http/http-context';
import { Api } from '../../../core/services/api';
import { AppNotification, NotificationPreference, PagedResult } from '../../../core/models';

// StaffNotificationsController  ->  /staff/me/notifications
// NotificationFilterDto has no [FromQuery(Name)], so the filters are sent as isRead / category / from / to.
@Service()
export class NotificationsApi {
  private readonly api = inject(Api);

  list(q: { page?: number; page_size?: number; category?: string | null; isRead?: boolean | null; q?: string | null } = {}) {
    return this.api.get<PagedResult<AppNotification>>('staff/me/notifications', q);
  }
  unreadCount() {
    return this.api.get<{ unread_count: number }>('staff/me/notifications/unread-count', undefined, new HttpContext().set(SILENT_ERROR, true));
  }
  markRead(id: number) {
    return this.api.patch<void>(`staff/me/notifications/${id}/read`);
  }
  markAllRead() {
    return this.api.patch<void>('staff/me/notifications/read-all');
  }
  delete(id: number) {
    return this.api.delete(`staff/me/notifications/${id}`);
  }
  preferences() {
    return this.api.get<NotificationPreference[]>('staff/me/notifications/preferences');
  }
  updatePreference(category: string, isEnabled: boolean) {
    return this.api.put<void>('staff/me/notifications/preferences', { category, is_enabled: isEnabled });
  }
}
