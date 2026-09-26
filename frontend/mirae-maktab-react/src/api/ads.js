import { apiFetch, toArray } from './client.js';

export async function fetchActiveAds() {
  try {
    const data = await apiFetch('/ads/active/');
    return toArray(data);
  } catch {
    return [];
  }
}
