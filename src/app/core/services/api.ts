import { HttpClient, HttpContext, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QueryParams } from '../models';

// Every call of the dashboard goes through this service:
//   base URL = {environment.apiUrl}/api/v1   (headers X-App / Authorization are added by authInterceptor)
@Service()
export class Api {
  private readonly http = inject(HttpClient);

  static readonly origin = environment.apiUrl.replace(/\/+$/, '');
  static readonly base = `${Api.origin}/api/v1`;

  url(path: string): string {
    return `${Api.base}/${path.replace(/^\/+/, '')}`;
  }

  // Images can come back relative ("/uploads/...") when the API stores files locally.
  static fileUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return `${Api.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  get<T>(path: string, query?: QueryParams, context?: HttpContext): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.params(query), context });
  }

  post<T>(path: string, body: unknown = {}, context?: HttpContext): Observable<T> {
    return this.http.post<T>(this.url(path), body, { context });
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  upload<T>(path: string, form: FormData): Observable<T> {
    return this.http.post<T>(this.url(path), form);
  }

  download(path: string, query?: QueryParams): Observable<HttpResponse<Blob>> {
    return this.http.get(this.url(path), { params: this.params(query), responseType: 'blob', observe: 'response' });
  }

  private params(query?: QueryParams): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value)) value.forEach((v) => (params = params.append(key, String(v))));
      else params = params.set(key, String(value));
    }
    return params;
  }
}
