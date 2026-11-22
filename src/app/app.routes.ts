import { Routes } from '@angular/router';
import { authGuard, guestGuard, sessionGuard } from './core/auth/guards/auth-guard';
import { permissionGuard } from './core/auth/guards/permission-guard';
import { P } from './core/constants/permissions';

// data.permissions = the user needs ANY of them (same strings as the API [HasPermission]).
const need = (...permissions: string[]) => ({ canActivate: [permissionGuard], data: { permissions } });

export const routes: Routes = [
  // ---------- Authentication ----------
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        title: 'Sign in | Axxodia',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'change-password',
        title: 'Change password | Axxodia',
        canActivate: [sessionGuard],
        loadComponent: () => import('./features/auth/pages/change-password/change-password').then((m) => m.ChangePassword),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ---------- Admin dashboard ----------
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard | Axxodia',
        ...need(P.dashboard.view),
        loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home').then((m) => m.DashboardHome),
      },

      // Catalog
      {
        path: 'catalog/locations',
        title: 'Locations | Axxodia',
        ...need(P.locations.view),
        loadComponent: () => import('./features/catalog/pages/locations-list/locations-list').then((m) => m.LocationsList),
      },
      {
        path: 'catalog/locations/new',
        title: 'New location | Axxodia',
        ...need(P.locations.create),
        loadComponent: () => import('./features/catalog/pages/location-form/location-form').then((m) => m.LocationForm),
      },
      {
        path: 'catalog/locations/:id',
        title: 'Location | Axxodia',
        ...need(P.locations.view),
        loadComponent: () => import('./features/catalog/pages/location-form/location-form').then((m) => m.LocationForm),
      },
      {
        path: 'catalog/unit-types',
        title: 'Unit types | Axxodia',
        ...need(P.unitTypes.view),
        loadComponent: () => import('./features/catalog/pages/unit-types-list/unit-types-list').then((m) => m.UnitTypesList),
      },
      {
        path: 'catalog/unit-types/new',
        title: 'New unit type | Axxodia',
        ...need(P.unitTypes.create),
        loadComponent: () => import('./features/catalog/pages/unit-type-form/unit-type-form').then((m) => m.UnitTypeForm),
      },
      {
        path: 'catalog/unit-types/:id',
        title: 'Unit type | Axxodia',
        ...need(P.unitTypes.view),
        loadComponent: () => import('./features/catalog/pages/unit-type-form/unit-type-form').then((m) => m.UnitTypeForm),
      },
      {
        path: 'catalog/rooms',
        title: 'Rooms | Axxodia',
        ...need(P.rooms.view),
        loadComponent: () => import('./features/catalog/pages/rooms-list/rooms-list').then((m) => m.RoomsList),
      },
      {
        path: 'catalog/rooms/new',
        title: 'New room | Axxodia',
        ...need(P.rooms.create),
        loadComponent: () => import('./features/catalog/pages/room-form/room-form').then((m) => m.RoomForm),
      },
      {
        path: 'catalog/rooms/:id',
        title: 'Room | Axxodia',
        ...need(P.rooms.view),
        loadComponent: () => import('./features/catalog/pages/room-form/room-form').then((m) => m.RoomForm),
      },
      {
        path: 'catalog/amenities',
        title: 'Amenities | Axxodia',
        loadComponent: () => import('./features/catalog/pages/amenities/amenities').then((m) => m.Amenities),
      },
      { path: 'catalog', redirectTo: 'catalog/locations', pathMatch: 'full' },

      // Reservations & stays
      {
        path: 'reservations',
        title: 'Reservations | Axxodia',
        ...need(P.reservations.view),
        loadComponent: () => import('./features/reservations/pages/reservations-list/reservations-list').then((m) => m.ReservationsList),
      },
      {
        path: 'reservations/new',
        title: 'New reservation | Axxodia',
        ...need(P.reservations.create),
        loadComponent: () => import('./features/reservations/pages/reservation-form/reservation-form').then((m) => m.ReservationForm),
      },
      {
        path: 'reservations/:id',
        title: 'Reservation | Axxodia',
        ...need(P.reservations.view),
        loadComponent: () => import('./features/reservations/pages/reservation-form/reservation-form').then((m) => m.ReservationForm),
      },
      {
        path: 'stays',
        title: 'Stays | Axxodia',
        ...need(P.stays.view),
        loadComponent: () => import('./features/reservations/pages/stays-list/stays-list').then((m) => m.StaysList),
      },

      // Offers & customers
      {
        path: 'offers',
        title: 'Offers | Axxodia',
        ...need(P.offers.view),
        loadComponent: () => import('./features/offers/pages/offers-list/offers-list').then((m) => m.OffersList),
      },
      {
        path: 'offers/new',
        title: 'New offer | Axxodia',
        ...need(P.offers.create),
        loadComponent: () => import('./features/offers/pages/offer-form/offer-form').then((m) => m.OfferForm),
      },
      {
        path: 'offers/:id',
        title: 'Offer | Axxodia',
        ...need(P.offers.view),
        loadComponent: () => import('./features/offers/pages/offer-form/offer-form').then((m) => m.OfferForm),
      },
      {
        path: 'customers',
        title: 'Customers | Axxodia',
        ...need(P.customers.view),
        loadComponent: () => import('./features/customers/pages/customers-list/customers-list').then((m) => m.CustomersList),
      },
      {
        path: 'customers/:id',
        title: 'Customer | Axxodia',
        ...need(P.customers.view),
        loadComponent: () => import('./features/customers/pages/customer-360/customer-360').then((m) => m.Customer360Page),
      },

      // Operations
      {
        path: 'chat-oversight',
        title: 'Chat oversight | Axxodia',
        ...need(P.chat.oversight),
        loadComponent: () => import('./features/chat/pages/chat-oversight/chat-oversight').then((m) => m.ChatOversight),
      },
      {
        path: 'housekeeping',
        title: 'Housekeeping | Axxodia',
        ...need(P.housekeeping.view, P.housekeepingTypes.manage),
        loadComponent: () => import('./features/housekeeping/pages/housekeeping/housekeeping').then((m) => m.Housekeeping),
      },
      {
        path: 'maintenance',
        title: 'Maintenance | Axxodia',
        ...need(P.maintenance.view),
        loadComponent: () => import('./features/maintenance/pages/maintenance-list/maintenance-list').then((m) => m.MaintenanceList),
      },
      {
        path: 'maintenance/:id',
        title: 'Maintenance task | Axxodia',
        ...need(P.maintenance.view),
        loadComponent: () => import('./features/maintenance/pages/maintenance-details/maintenance-details').then((m) => m.MaintenanceDetails),
      },
      {
        path: 'guest-services/services',
        title: 'Guest services | Axxodia',
        ...need(P.services.manage),
        loadComponent: () => import('./features/guest-services/pages/services-list/services-list').then((m) => m.GuestServicesList),
      },
      {
        path: 'guest-services/requests',
        title: 'Service requests | Axxodia',
        ...need(P.serviceRequests.view),
        loadComponent: () => import('./features/guest-services/pages/requests-list/requests-list').then((m) => m.ServiceRequestsList),
      },
      { path: 'guest-services', redirectTo: 'guest-services/requests', pathMatch: 'full' },

      // Team & insights
      {
        path: 'staff',
        title: 'Staff | Axxodia',
        ...need(P.dashboard.view),
        loadComponent: () => import('./features/staff/pages/staff-list/staff-list').then((m) => m.StaffList),
      },
      {
        path: 'reports',
        title: 'Reports | Axxodia',
        ...need(P.reports.view),
        loadComponent: () => import('./features/reports/pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'notifications',
        title: 'Notifications | Axxodia',
        loadComponent: () => import('./features/notifications/pages/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'profile',
        title: 'My profile | Axxodia',
        loadComponent: () => import('./features/profile/pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'forbidden',
        title: 'No access | Axxodia',
        loadComponent: () => import('./features/errors/pages/forbidden/forbidden').then((m) => m.Forbidden),
      },
      {
        path: '**',
        title: 'Page not found | Axxodia',
        loadComponent: () => import('./features/errors/pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
