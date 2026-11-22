import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  GuestService,
  GuestServiceDetails,
  GuestServiceRequest,
  GuestServiceRequestDetails,
  InternetPackage,
  InternetPackageRequest,
  PagedResult,
  QueryParams,
} from '../../../core/models';

// AdminGuestServicesController  ->  /admin/guest-services
@Service()
export class GuestServicesApi {
  private readonly api = inject(Api);

  services(q: QueryParams = {}) {
    return this.api.get<PagedResult<GuestService>>('admin/guest-services', q);
  }
  service(id: number) {
    return this.api.get<GuestServiceDetails>(`admin/guest-services/${id}`);
  }
  create(dto: GuestServiceRequest) {
    return this.api.post<GuestServiceDetails>('admin/guest-services', dto);
  }
  update(id: number, dto: GuestServiceRequest) {
    return this.api.put<GuestServiceDetails>(`admin/guest-services/${id}`, dto);
  }
  setActive(id: number, isActive: boolean) {
    return this.api.patch<void>(`admin/guest-services/${id}/status`, { is_active: isActive });
  }
  delete(id: number) {
    return this.api.delete(`admin/guest-services/${id}`);
  }

  // ---------- Internet packages ----------
  packages(serviceId: number, isActive?: boolean | null) {
    return this.api.get<InternetPackage[]>(`admin/guest-services/${serviceId}/internet-packages`, { is_active: isActive });
  }
  createPackage(serviceId: number, dto: InternetPackageRequest) {
    return this.api.post<InternetPackage>(`admin/guest-services/${serviceId}/internet-packages`, dto);
  }
  updatePackage(packageId: number, dto: InternetPackageRequest) {
    return this.api.put<InternetPackage>(`admin/guest-services/internet-packages/${packageId}`, dto);
  }
  setPackageActive(packageId: number, isActive: boolean) {
    return this.api.patch<void>(`admin/guest-services/internet-packages/${packageId}/status`, { is_active: isActive });
  }
  deletePackage(packageId: number) {
    return this.api.delete(`admin/guest-services/internet-packages/${packageId}`);
  }

  // ---------- Requests (monitoring) ----------
  requests(q: QueryParams = {}) {
    return this.api.get<PagedResult<GuestServiceRequestDetails>>('admin/guest-services/requests', q);
  }
  request(id: number) {
    return this.api.get<GuestServiceRequestDetails>(`admin/guest-services/requests/${id}`);
  }
}
