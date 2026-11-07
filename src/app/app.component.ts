import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { keycloak } from './keycloak';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  logout(): void {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  }
}