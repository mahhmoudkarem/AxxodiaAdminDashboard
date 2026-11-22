// Axxodia.Shared/Dtos/Catalog

// Amenities are a FIXED list (AmenityCatalog in the API: wifi, gym, sauna...).
// The admin only picks from it in the location / unit type forms. `code` is the stable key.
export interface AmenitySummary {
  id: number;
  code?: string | null;
  name_ar: string;
  name_en: string;
}

export interface Amenity extends AmenitySummary {
  is_active: boolean;
  created_at: string;
}

// ---------- Locations ----------
export interface LocationListItem {
  id: number;
  name_ar: string;
  name_en: string;
  area_ar?: string | null;
  area_en?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  is_active: boolean;
  sort_order: number;
  unit_types_count: number;
  rooms_count: number;
}

export interface LocationDetails {
  id: number;
  version: number;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  area_ar?: string | null;
  area_en?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  stay_instructions_ar?: string | null;
  stay_instructions_en?: string | null;
  customer_service_staff_id?: number | null;
  customer_service_staff_name?: string | null;
  is_active: boolean;
  sort_order: number;
  amenities: AmenitySummary[];
  created_at: string;
}

export interface LocationRequest {
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  area_ar?: string | null;
  area_en?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  stay_instructions_ar?: string | null;
  stay_instructions_en?: string | null;
  amenity_ids: number[];
  is_active: boolean;
  sort_order: number;
  // update only
  customer_service_staff_id?: number | null;
  version?: number;
}

// ---------- Unit types ----------
export interface UnitType {
  id: number;
  version: number;
  location_id: number;
  name_ar: string;
  name_en: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm?: number | null;
  max_guests: number;
  description_ar?: string | null;
  description_en?: string | null;
  is_active: boolean;
  amenities: AmenitySummary[];
  rooms_count: number;
  created_at: string;
}

export interface UnitTypeRequest {
  location_id?: number; // create only
  name_ar: string;
  name_en: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm?: number | null;
  max_guests: number;
  description_ar?: string | null;
  description_en?: string | null;
  amenity_ids: number[];
  is_active: boolean;
  version?: number; // update only
}

// ---------- Rooms ----------
export type RoomStatus = 'Available' | 'OutOfService';

export interface Room {
  id: number;
  version: number;
  location_id: number;
  unit_type_id: number;
  room_number: string;
  floor?: string | null;
  status: RoomStatus | string;
  notes?: string | null;
  wifi_name?: string | null;
  has_wifi_password: boolean;
  created_at: string;
}

export interface RoomRequest {
  location_id?: number; // create only
  unit_type_id?: number; // create only
  room_number: string;
  floor?: string | null;
  status?: RoomStatus | string; // update only
  notes?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  version?: number; // update only
}

export interface WifiSecret {
  wifi_name?: string | null;
  wifi_password?: string | null;
}

// ---------- Media / entity images ----------
export type MediaPurpose = 'location' | 'unit_type' | 'room' | 'offer' | 'onboarding';
export type ImageEntityType = 'Location' | 'UnitType' | 'Room';

export interface Media {
  id: number;
  url: string;
  thumb_url?: string | null;
  width: number;
  height: number;
  size_bytes: number;
  content_type: string;
  purpose: string;
  created_at: string;
}

export interface EntityImage {
  id: number;
  entity_type: ImageEntityType;
  entity_id: number;
  media_id: number;
  image_url: string;
  thumb_url?: string | null;
  sort_order: number;
  is_cover: boolean;
}
