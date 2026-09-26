import { apiFetch, toArray } from './client.js';

export function createParentLink(phone) {
  return apiFetch('/parents/links/', { method: 'POST', body: { phone } });
}

export async function fetchMyParentLinks() {
  try {
    const data = await apiFetch('/parents/links/');
    return toArray(data);
  } catch {
    return [];
  }
}
