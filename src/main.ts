import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { keycloak } from './app/keycloak';
import { authInterceptor } from './app/auth.interceptor';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

keycloak.init({
  onLoad: 'login-required',
  pkceMethod: 'S256'
}).then(() => {
  bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideRouter(routes)
    ]
  }).catch((err) => console.error(err));
}).catch((err) => {
  console.error('Błąd inicjalizacji Keycloak:', err);
});