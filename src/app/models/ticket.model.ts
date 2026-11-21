export type TicketStatus =
  | 'NEW'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface Ticket {
  id: number;
  message: string;
  username: string;
  sendTime: string;
  processedAt: string;
  category: string | null;
  status: TicketStatus;
  priority: TicketPriority;
}
