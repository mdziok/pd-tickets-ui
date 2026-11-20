import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Ticket,
  TicketStatus,
  TicketPriority
} from '../../models/ticket.model';
import { keycloak } from '../../keycloak';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  loading = true;
  private hasLoaded = false;
  savingIds = new Set<number>();
  errorMessage = '';
  private refreshSubscription?: Subscription;
  private readonly refreshIntervalMs = 5000;

  readonly statusLabels: Record<TicketStatus, string> = {
    NEW: 'Nowe',
    OPEN: 'Otwarte',
    IN_PROGRESS: 'W trakcie',
    RESOLVED: 'Rozwiązane',
    CLOSED: 'Zamknięte'
  };

  readonly priorityLabels: Record<TicketPriority, string> = {
    LOW: 'Niski',
    MEDIUM: 'Średni',
    HIGH: 'Wysoki',
    CRITICAL: 'Krytyczny'
  };


  readonly categoryLabels: Partial<Record<string, string>> = {
    HARDWARE: 'Sprzęt',
    SOFTWARE: 'Oprogramowanie',
    NETWORK: 'Sieć',
    ACCESS: 'Dostęp i uprawnienia',
    OTHER: 'Inne'
  };

  readonly statuses: TicketStatus[] = [
    'NEW', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  ];

  readonly priorities: TicketPriority[] = [
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef
  ) {}

  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedCategory = '';
  sortOrder = 'newest';

  readonly categories = [
    'HARDWARE',
    'SOFTWARE',
    'NETWORK',
    'ACCESS',
    'OTHER'
  ];

  get filteredTickets(): Ticket[] {
    const search = this.searchTerm.toLowerCase().trim();

    return this.tickets
      .filter(ticket =>
        (!search ||
          (ticket.message ?? '').toLowerCase().includes(search) ||
          (ticket.username ?? '').toLowerCase().includes(search) ||
          String(ticket.id).includes(search)) &&
        (!this.selectedStatus ||
          ticket.status === this.selectedStatus) &&
        (!this.selectedPriority ||
          ticket.priority === this.selectedPriority) &&
        (!this.selectedCategory ||
          ticket.category === this.selectedCategory)
      )
      .sort((a, b) =>
        this.sortOrder === 'newest'
          ? new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime()
          : new Date(a.sendTime).getTime() - new Date(b.sendTime).getTime()
      );
  }


  ngOnInit(): void {
    this.loadTickets();
    this.refreshSubscription = interval(this.refreshIntervalMs).subscribe(() => {
      if (!document.hidden) this.loadTickets();
    });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private readonly onVisibilityChange = (): void => {
    if (!document.hidden) this.loadTickets();
  };

  loadTickets(): void {
    const endpoint = 'http://localhost:8080/api/tickets';

    this.errorMessage = '';
    if (!this.hasLoaded) this.loading = true;

    this.http.get<unknown>(endpoint).subscribe({
      next: (response: unknown) => {
        // API zwraca bezpośrednio tablicę: [{ id, message, username, ... }]
        // Obsługujemy też opakowane odpowiedzi, aby frontend był odporny na zmianę DTO.
        let rows: unknown = response;
        if (!Array.isArray(rows) && rows && typeof rows === 'object') {
          const body = rows as Record<string, unknown>;
          rows = body['tickets'] ?? body['content'] ?? body['data'] ?? [];
        }

        if (!Array.isArray(rows)) {
          console.error('Nieprawidłowy format odpowiedzi /api/tickets:', response);
          this.errorMessage = 'Serwer zwrócił nieprawidłowy format zgłoszeń.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.tickets = (rows as Record<string, unknown>[]).map((row) => ({
          id: Number(row['id']),
          message: String(row['message'] ?? row['description'] ?? ''),
          username: String(row['username'] ?? ''),
          sendTime: String(row['sendTime'] ?? row['createdAt'] ?? ''),
          processedAt: row['processedAt'] == null ? '' : String(row['processedAt']),
          category: row['category'] == null ? null : String(row['category']),
          status: row['status'] as TicketStatus,
          priority: row['priority'] as TicketPriority
        } as Ticket));

        this.hasLoaded = true;
        this.loading = false;
        this.errorMessage = '';
        console.info(`[Moje zgłoszenia] Pobrano ${this.tickets.length} zgłoszeń`, this.tickets);
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Błąd pobierania zgłoszeń:', error);
        this.errorMessage = error.status
          ? `Nie udało się pobrać zgłoszeń (HTTP ${error.status}).`
          : 'Nie udało się połączyć z serwerem.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  updateStatus(ticket: Ticket, status: string): void {
    if (this.statuses.includes(status as TicketStatus)) {
      this.updateTicket(ticket, 'status', status as TicketStatus);
    }
  }

  updatePriority(ticket: Ticket, priority: string): void {
    if (this.priorities.includes(priority as TicketPriority)) {
      this.updateTicket(ticket, 'priority', priority as TicketPriority);
    }
  }

  private updateTicket(
    ticket: Ticket,
    field: 'status' | 'priority',
    value: TicketStatus | TicketPriority
  ): void {
    if (!this.canManageTickets || this.savingIds.has(ticket.id)) {
      return;
    }

    this.errorMessage = '';
    this.savingIds.add(ticket.id);

    this.http.patch<Ticket>(
      `http://localhost:8080/api/tickets/${ticket.id}/${field}`,
      { [field]: value }
    ).subscribe({
      next: () => {
        this.savingIds.delete(ticket.id);
        this.loadTickets();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Błąd aktualizacji zgłoszenia:', error);
        this.errorMessage =
          `Nie udało się zmienić pola ${field} dla zgłoszenia #${ticket.id}.`;

        this.savingIds.delete(ticket.id);
        this.loadTickets();
      }
    });
  }

  get canManageTickets(): boolean {
    const roles = keycloak.realmAccess?.roles ?? [];

    return roles.includes('TECHNICIAN') || roles.includes('ADMIN');
  }

}
