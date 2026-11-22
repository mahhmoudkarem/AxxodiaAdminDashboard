import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Offer, OfferDetails, OfferRequest } from '../../../core/models';

// AdminOffersController  ->  /admin/offers
@Service()
export class OffersApi {
  private readonly api = inject(Api);

  list() {
    return this.api.get<Offer[]>('admin/offers');
  }
  get(id: number) {
    return this.api.get<OfferDetails>(`admin/offers/${id}`);
  }
  create(dto: OfferRequest) {
    return this.api.post<OfferDetails>('admin/offers', dto);
  }
  update(id: number, dto: OfferRequest) {
    return this.api.put<OfferDetails>(`admin/offers/${id}`, dto);
  }
  setActive(id: number, isActive: boolean) {
    return this.api.patch<void>(`admin/offers/${id}/status`, { is_active: isActive });
  }
  delete(id: number) {
    return this.api.delete(`admin/offers/${id}`);
  }
}
