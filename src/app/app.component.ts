import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  message = '';
  status = '';
  statusType: 'success' | 'error' | 'info' = 'info';
  loading = false;
  responseDetails = '';

  // Zmień adres na endpoint docelowej aplikacji REST.
  private readonly apiUrl = 'http://localhost:8080/api/messages';

  constructor(private readonly http: HttpClient) {}

  get apiEndpoint(): string {
    return this.apiUrl;
  }

  sendMessage(): void {
    const text = this.message.trim();
    if (!text || this.loading) return;

    this.loading = true;
    this.status = 'Wysyłanie danych…';
    this.statusType = 'info';
    this.responseDetails = '';

    this.http.post<unknown>(this.apiUrl, { message: text, user: "user", send_time: Date.now()}).subscribe({
      next: (response) => {
        this.status = 'Dane zostały wysłane pomyślnie.';
        this.statusType = 'success';
        this.responseDetails = this.formatResponse(response);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.status = 'Nie udało się wysłać danych.';
        this.statusType = 'error';
        this.responseDetails = error.status
          ? `HTTP ${error.status}: ${error.message}`
          : `Nie można połączyć się z API. Sprawdź adres serwera i konfigurację CORS.`;
        this.loading = false;
      }
    });
  }

  private formatResponse(response: unknown): string {
    if (response === null || response === undefined || response === '') {
      return 'Serwer nie zwrócił treści odpowiedzi.';
    }
    if (typeof response === 'string') return response;
    try {
      return JSON.stringify(response, null, 2);
    } catch {
      return String(response);
    }
  }
}
