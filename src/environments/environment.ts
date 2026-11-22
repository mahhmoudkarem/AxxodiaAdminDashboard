// Production: the dashboard calls the Axxodia API directly.
// The refresh token is an HttpOnly cookie, so the API must allow this dashboard's origin
// in "Cors:AllowedOrigins" (appsettings.json) and send the cookie with SameSite=None; Secure.
export const environment = {
  production: true,
  apiUrl: 'https://axxodia.runasp.net',
};
