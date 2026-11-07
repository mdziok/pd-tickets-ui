import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TicketListComponent } from './pages/ticket-list/ticket-list.component';
import { TicketCreateComponent } from './pages/ticket-create/ticket-create.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'tickets',
    component: TicketListComponent
  },
  {
    path: 'tickets/new',
    component: TicketCreateComponent
  }
];