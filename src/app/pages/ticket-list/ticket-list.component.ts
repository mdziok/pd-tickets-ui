import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Ticket,
  TicketStatus,
  TicketPriority
} from '../../models/ticket.model';
import { keycloak } from '../../keycloak';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  savingIds = new Set<number>();
  errorMessage = '';

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

  constructor(private readonly http: HttpClient) {}

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
          ticket.message.toLowerCase().includes(search) ||
          ticket.username.toLowerCase().includes(search) ||
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
  }

  loadTickets(): void {
    const endpoint = this.canManageTickets
      ? 'http://localhost:8080/api/tickets/all'
      : 'http://localhost:8080/api/tickets';

    this.errorMessage = '';

    this.http.get<Ticket[]>(endpoint).subscribe({
      next: (response) => {
        this.tickets = response;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Błąd pobierania zgłoszeń:', error);
        this.errorMessage = 'Nie udało się pobrać zgłoszeń.';
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
