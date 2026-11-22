// Development (npm start): requests go to the same origin (localhost:4200) and
// proxy.conf.json forwards /api, /uploads and /hubs to https://axxodia.runasp.net.
// To work against a local API instead use: npm run start:local  (proxy.local.json -> http://localhost:5009)
export const environment = {
  production: false,
  apiUrl: '',
};
