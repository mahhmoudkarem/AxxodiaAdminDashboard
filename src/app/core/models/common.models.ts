// Shapes shared by many endpoints (see Axxodia.Shared/Dtos/Common).

export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
}

// PagedResult<T>  ->  { data: [...], meta: { page, page_size, total } }
export interface PagedResult<T> {
  data: T[];
  meta: PageMeta;
}

// 201 answer that only returns the new id: { id: 5 }
export interface CreatedId {
  id: number;
}

// Normalized error (built by errorInterceptor from { error: { code, message, fields } } or ProblemDetails).
export interface ApiError {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

export type QueryValue = string | number | boolean | null | undefined | (string | number)[];
export type QueryParams = Record<string, QueryValue>;
