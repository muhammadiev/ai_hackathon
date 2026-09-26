import { apiFetch, toArray } from './client.js';

export async function fetchMyMastery() {
  try {
    const data = await apiFetch('/mastery/me/');
    return toArray(data);
  } catch {
    return null;
  }
}
