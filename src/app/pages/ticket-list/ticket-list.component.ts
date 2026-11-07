import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Ticket } from '../../models/ticket.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit {

  tickets: Ticket[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.http.get<Ticket[]>('http://localhost:8080/api/tickets').subscribe({
      next: (response) => {
        this.tickets = response;
        console.log('Zgłoszenia w TicketListComponent:', response);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Błąd pobierania zgłoszeń:', error);
      }
    });
  }
}