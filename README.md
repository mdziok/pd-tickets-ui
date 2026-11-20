# REST Frontend (Angular)

Prosty frontend Angular do projektu:
- wpisanie treści zgłoszenia
- wysłanie zgłoszenia do głównego backendu
- przeglądanie listy zgłoszeń (TODO)
- integracja z Keycloak (TODO)

## Wymagania

- Node.js 22 (lub wersja zgodna z Angular CLI)

## Docker

Zbuduj obraz:

```bash
docker build -t pd-tickets-ui .
```

Uruchom kontener:

```bash
docker run --rm -p 8081:80 --name pd-tickets-ui pd-tickets-ui
```

Otwórz http://localhost:8081.

## Uruchomienie lokalne

```bash
npm install
npm start
```

Otwórz http://localhost:4200.

## Konfiguracja API

Domyślnie frontend wysyła:

```http
POST /api/messages
Content-Type: application/json
```

```json
{
  "message": "Tekst wpisany przez użytkownika",
  "user": "user",
  "send_time": "aktualny czas wysłania zgłoszenia"
}
```
