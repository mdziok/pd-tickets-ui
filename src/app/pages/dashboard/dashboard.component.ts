import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Ticket } from '../../models/ticket.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  tickets: Ticket[] = [];
  loading = true;
  errorMessage = '';
  private refreshSubscription?: Subscription;
  private readonly refreshIntervalMs = 5000;

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef
  ) {}

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
    // Nie pokazuj ponownie ekranu ładowania przy każdym automatycznym odświeżeniu.
    this.errorMessage = '';
    this.http.get<unknown>('http://localhost:8080/api/tickets').subscribe({
      next: (response) => {
        if (!Array.isArray(response)) {
          console.error('Dashboard - nieprawidłowa odpowiedź API:', response);
          this.tickets = [];
          this.errorMessage = 'Serwer zwrócił nieprawidłowe dane.';
        } else {
          this.tickets = (response as Record<string, unknown>[]).map(row => ({
            id: Number(row['id']),
            message: String(row['message'] ?? ''),
            username: String(row['username'] ?? ''),
            sendTime: String(row['sendTime'] ?? ''),
            processedAt: String(row['processedAt'] ?? ''),
            category: row['category'] == null ? null : String(row['category']),
            status: row['status'] as Ticket['status'],
            priority: row['priority'] as Ticket['priority']
          }));
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Dashboard - błąd pobierania:', error);
        this.errorMessage = `Nie udało się pobrać statystyk (HTTP ${error.status || 'brak połączenia'}).`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}