import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  tickets: Ticket[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.http.get<Ticket[]>('http://localhost:8080/api/tickets').subscribe({
      next: (response) => {
        this.tickets = response;
        console.log('Dashboard - pobrane zgłoszenia:', response);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Dashboard - błąd pobierania:', error);
      }
    });
  }
}