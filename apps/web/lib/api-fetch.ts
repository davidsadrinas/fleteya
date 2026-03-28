/**
 * Fetch wrapper that includes X-Requested-With header for CSRF protection.
 * Use this for all client-side API calls to /api/* endpoints.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "FleteYa");
  }
  return fetch(input, { ...init, headers });
}
