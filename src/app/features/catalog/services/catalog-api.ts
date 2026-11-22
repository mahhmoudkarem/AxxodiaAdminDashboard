import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  Amenity,
  BulkCreateRoomsRequest,
  BulkCreateRoomsResult,
  CreatedId,
  EntityImage,
  ImageEntityType,
  LocationDetails,
  LocationListItem,
  LocationRequest,
  Media,
  MediaPurpose,
  PagedResult,
  Room,
  RoomRequest,
  UnitType,
  UnitTypeRequest,
  WifiSecret,
} from '../../../core/models';

// LocationsController, UnitTypesController, RoomsController, AmenitiesController,
// MediaController, EntityImagesController  (all under /admin/...)
@Service()
export class CatalogApi {
  private readonly api = inject(Api);

  // ---------- Locations ----------
  locations(q: { page?: number; page_size?: number; q?: string; is_active?: boolean | null; sort?: string; order?: string } = {}) {
    return this.api.get<PagedResult<LocationListItem>>('admin/locations', q);
  }
  // All locations for dropdowns (page_size max = 100)
  allLocations() {
    return this.locations({ page: 1, page_size: 100, sort: 'sort_order', order: 'asc' });
  }
  location(id: number) {
    return this.api.get<LocationDetails>(`admin/locations/${id}`);
  }
  createLocation(dto: LocationRequest) {
    return this.api.post<CreatedId>('admin/locations', dto);
  }
  updateLocation(id: number, dto: LocationRequest) {
    return this.api.put<void>(`admin/locations/${id}`, dto);
  }
  reorderLocations(ids: number[]) {
    return this.api.put<void>('admin/locations/reorder', { ids });
  }
  deleteLocation(id: number) {
    return this.api.delete(`admin/locations/${id}`);
  }

  // ---------- Unit types ----------
  unitTypes(q: { page?: number; page_size?: number; q?: string; location_id?: number | null; is_active?: boolean | null } = {}) {
    return this.api.get<PagedResult<UnitType>>('admin/unit-types', q);
  }
  unitType(id: number) {
    return this.api.get<UnitType>(`admin/unit-types/${id}`);
  }
  createUnitType(dto: UnitTypeRequest) {
    return this.api.post<CreatedId>('admin/unit-types', dto);
  }
  updateUnitType(id: number, dto: UnitTypeRequest) {
    return this.api.put<void>(`admin/unit-types/${id}`, dto);
  }
  deleteUnitType(id: number) {
    return this.api.delete(`admin/unit-types/${id}`);
  }

  // ---------- Rooms ----------
  rooms(
    q: { page?: number; page_size?: number; q?: string; location_id?: number | null; unit_type_id?: number | null; status?: string | null } = {},
  ) {
    return this.api.get<PagedResult<Room>>('admin/rooms', q);
  }
  room(id: number) {
    return this.api.get<Room>(`admin/rooms/${id}`);
  }
  roomWifi(id: number) {
    return this.api.get<WifiSecret>(`admin/rooms/${id}/wifi`);
  }
  createRoom(dto: RoomRequest) {
    return this.api.post<CreatedId>('admin/rooms', dto);
  }
  // numbers from..to (max 200), optional prefix; existing numbers are skipped
  bulkCreateRooms(dto: BulkCreateRoomsRequest) {
    return this.api.post<BulkCreateRoomsResult>('admin/rooms/bulk', dto);
  }
  updateRoom(id: number, dto: RoomRequest) {
    return this.api.put<void>(`admin/rooms/${id}`, dto);
  }
  deleteRoom(id: number) {
    return this.api.delete(`admin/rooms/${id}`);
  }

  // ---------- Amenities (fixed list, read only) ----------
  amenities(isActive?: boolean | null) {
    return this.api.get<Amenity[]>('admin/amenities', { is_active: isActive });
  }
  amenity(id: number) {
    return this.api.get<Amenity>(`admin/amenities/${id}`);
  }

  // ---------- Media + entity images ----------
  uploadMedia(file: File, purpose: MediaPurpose) {
    const form = new FormData();
    form.append('File', file);
    form.append('Purpose', purpose);
    return this.api.upload<Media>('admin/media', form);
  }
  deleteMedia(id: number) {
    return this.api.delete(`admin/media/${id}`);
  }
  entityImages(entityType: ImageEntityType, entityId: number) {
    return this.api.get<EntityImage[]>('admin/entity-images', { entity_type: entityType, entity_id: entityId });
  }
  addEntityImage(dto: { entity_type: ImageEntityType; entity_id: number; media_id: number; sort_order: number; is_cover: boolean }) {
    return this.api.post<CreatedId>('admin/entity-images', dto);
  }
  setCover(id: number) {
    return this.api.put<void>(`admin/entity-images/${id}/cover`);
  }
  deleteEntityImage(id: number) {
    return this.api.delete(`admin/entity-images/${id}`);
  }
}
