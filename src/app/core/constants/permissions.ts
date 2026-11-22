// Same strings as Axxodia.Domain/Entities/IdentityModule/Permissions.cs
// The dashboard hides menus / buttons with them; the API still checks every request.
export const P = {
  dashboard: { view: 'dashboard.view' },
  locations: { view: 'locations.view', create: 'locations.create', edit: 'locations.edit', delete: 'locations.delete' },
  amenities: { manage: 'amenities.manage' },
  unitTypes: { view: 'unit_types.view', create: 'unit_types.create', edit: 'unit_types.edit', delete: 'unit_types.delete' },
  rooms: {
    view: 'rooms.view',
    create: 'rooms.create',
    edit: 'rooms.edit',
    delete: 'rooms.delete',
    wifiView: 'rooms.wifi.view',
    wifiEdit: 'rooms.wifi.edit',
  },
  reservations: { view: 'reservations.view', create: 'reservations.create', edit: 'reservations.edit', delete: 'reservations.delete' },
  stays: { view: 'Stays.View', edit: 'Stays.Edit' },
  customers: { view: 'customers.view', edit: 'customers.edit', export: 'customers.export' },
  offers: { view: 'offers.view', create: 'offers.create', edit: 'offers.edit', delete: 'offers.delete', publish: 'offers.publish' },
  chat: { oversight: 'chat.oversight' },
  housekeeping: { view: 'hk.view' },
  housekeepingTypes: { manage: 'hk_types.manage' },
  maintenance: { view: 'mt.view', assign: 'mt.assign' },
  services: { manage: 'services.manage' },
  serviceRequests: { view: 'service_requests.view' },
  reports: { view: 'reports.view', export: 'reports.export' },
  content: { manage: 'content.manage' },
  staff: { manage: 'staff.manage' },
} as const;
