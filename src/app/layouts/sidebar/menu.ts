import { P } from '../../core/constants/permissions';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  // the user needs ANY of these permissions (empty = every admin)
  permissions?: string[];
  exact?: boolean;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// One entry per admin-dashboard module of the API (ApiAudience.AdminWeb controllers).
export const MENU: MenuGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: 'fa-house', route: '/dashboard', permissions: [P.dashboard.view] }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Reservations', icon: 'fa-calendar-check', route: '/reservations', permissions: [P.reservations.view] },
      { label: 'Stays', icon: 'fa-bed', route: '/stays', permissions: [P.stays.view] },
      { label: 'Housekeeping', icon: 'fa-broom', route: '/housekeeping', permissions: [P.housekeeping.view, P.housekeepingTypes.manage] },
      { label: 'Maintenance', icon: 'fa-screwdriver-wrench', route: '/maintenance', permissions: [P.maintenance.view] },
      { label: 'Service Requests', icon: 'fa-bell-concierge', route: '/guest-services/requests', permissions: [P.serviceRequests.view] },
      { label: 'Chat Oversight', icon: 'fa-comments', route: '/chat-oversight', permissions: [P.chat.oversight] },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Locations', icon: 'fa-building', route: '/catalog/locations', permissions: [P.locations.view] },
      { label: 'Unit Types', icon: 'fa-layer-group', route: '/catalog/unit-types', permissions: [P.unitTypes.view] },
      { label: 'Rooms', icon: 'fa-door-open', route: '/catalog/rooms', permissions: [P.rooms.view] },
      { label: 'Amenities', icon: 'fa-spa', route: '/catalog/amenities' },
      { label: 'Guest Services', icon: 'fa-concierge-bell', route: '/guest-services/services', permissions: [P.services.manage] },
    ],
  },
  {
    title: 'Customers & Marketing',
    items: [
      { label: 'Customers', icon: 'fa-users', route: '/customers', permissions: [P.customers.view] },
      { label: 'Offers', icon: 'fa-tags', route: '/offers', permissions: [P.offers.view] },
    ],
  },
  {
    title: 'Team & Insights',
    items: [
      { label: 'Staff', icon: 'fa-id-badge', route: '/staff', permissions: [P.dashboard.view] },
      { label: 'Reports', icon: 'fa-chart-line', route: '/reports', permissions: [P.reports.view] },
      { label: 'Notifications', icon: 'fa-bell', route: '/notifications' },
    ],
  },
];
