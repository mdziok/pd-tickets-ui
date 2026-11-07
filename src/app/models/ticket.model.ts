export interface Ticket {
  id: number;
  message: string;
  username: string;
  sendTime: string;
  processedAt: string;
  category: string | null;
}