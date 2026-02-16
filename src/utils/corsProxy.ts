// CORS proxy wrapper for accessing APIs without CORS headers

export const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors.sh/?'
];

export function proxiedUrl(targetUrl: string, proxyIndex: number = 0): string {
  const validIndex = proxyIndex >= 0 && proxyIndex < CORS_PROXIES.length ? proxyIndex : 0;
  return CORS_PROXIES[validIndex] + encodeURIComponent(targetUrl);
}
