import { HttpContextToken } from '@angular/common/http';

// Do not try the refresh-token flow for this request (login / refresh / logout themselves).
export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);

// Do not show the global error toast (the caller shows its own message).
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);
