import { apiFetch, toArray } from './client.js';

export async function fetchAllBadges() {
  const data = await apiFetch('/badges/');
  return toArray(data);
}

export async function fetchMyBadges() {
  const data = await apiFetch('/student-badges/');
  return toArray(data);
}