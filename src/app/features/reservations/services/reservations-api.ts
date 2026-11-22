import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Reservation, ReservationListItem, ReservationRequest, StayDetails, StayListItem } from '../../../core/models';

// ReservationsController (/admin/reservations) + StaysController (/admin/stays)
@Service()
export class ReservationsApi {
  private readonly api = inject(Api);

  list() {
    return this.api.get<ReservationListItem[]>('admin/reservations');
  }
  get(id: number) {
    return this.api.get<Reservation>(`admin/reservations/${id}`);
  }
  create(dto: ReservationRequest) {
    return this.api.post<Reservation>('admin/reservations', dto);
  }
  update(id: number, dto: ReservationRequest) {
    return this.api.put<Reservation>(`admin/reservations/${id}`, dto);
  }
  cancel(id: number, reason: string) {
    return this.api.post<void>(`admin/reservations/${id}/cancel`, { reason });
  }
  delete(id: number) {
    return this.api.delete(`admin/reservations/${id}`);
  }

  // ---------- Stays ----------
  stays() {
    return this.api.get<StayListItem[]>('admin/stays');
  }
  stay(id: number) {
    return this.api.get<StayDetails>(`admin/stays/${id}`);
  }
  cancelStay(id: number, reason: string) {
    return this.api.post<void>(`admin/stays/${id}/cancel`, { reason });
  }
}
