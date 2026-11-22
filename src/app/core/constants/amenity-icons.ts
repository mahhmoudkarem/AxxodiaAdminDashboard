// Font Awesome icon for every amenity code of AmenityCatalog (Axxodia.Domain/Entities/CatalogModule/AmenityCatalog.cs).
// The API sends only the code; each app shows its own icon for it.
export const AMENITY_ICONS: Record<string, string> = {
  wifi: 'fa-wifi',
  air_conditioning: 'fa-snowflake',
  heating: 'fa-temperature-arrow-up',
  tv: 'fa-tv',
  kitchen: 'fa-kitchen-set',
  refrigerator: 'fa-temperature-low',
  washing_machine: 'fa-soap',
  balcony: 'fa-building',
  sea_view: 'fa-water',
  pool_view: 'fa-person-swimming',
  private_pool: 'fa-water-ladder',
  swimming_pool: 'fa-person-swimming',
  gym: 'fa-dumbbell',
  sauna: 'fa-hot-tub-person',
  jacuzzi: 'fa-hot-tub-person',
  steam_room: 'fa-cloud',
  spa: 'fa-spa',
  parking: 'fa-square-parking',
  security_24h: 'fa-shield-halved',
  elevator: 'fa-elevator',
  beach_access: 'fa-umbrella-beach',
  bbq_area: 'fa-fire-burner',
  garden: 'fa-tree',
  kids_area: 'fa-children',
  restaurant: 'fa-utensils',
  room_service: 'fa-bell-concierge',
  laundry_service: 'fa-shirt',
  safe_box: 'fa-vault',
  hair_dryer: 'fa-wind',
  iron: 'fa-shirt',
  pets_allowed: 'fa-paw',
  accessible: 'fa-wheelchair',
};

export function amenityIcon(code: string | null | undefined): string {
  return (code && AMENITY_ICONS[code]) || 'fa-star';
}
