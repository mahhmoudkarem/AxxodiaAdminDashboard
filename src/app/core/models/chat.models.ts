// Axxodia.Shared/Dtos/Chat  (admin oversight is READ ONLY)

export type ConversationTab = 'all' | 'open' | 'closed';

export interface ConversationCustomer {
  id: number;
  display_name: string;
  room_number?: string | null;
  language: string;
}

export interface ConversationListItem {
  id: number;
  customer: ConversationCustomer;
  status: 'Unassigned' | 'Assigned' | 'Closed' | string;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  unread_for_staff: number;
  waiting_since?: string | null;
  sla_breached: boolean;
}

export interface ConversationDetail extends ConversationListItem {
  closed_at?: string | null;
  closed_topic_id?: number | null;
  closed_note?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  client_id?: string | null;
  sender_type: 'System' | 'Staff' | 'Customer' | string;
  sender_staff_id?: number | null;
  body: string;
  is_internal_note: boolean;
  status: string;
  sent_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
}
