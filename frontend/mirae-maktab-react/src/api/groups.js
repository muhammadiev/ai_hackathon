import { apiFetch, toArray } from './client.js';

export async function fetchMyGroups() {
  const data = await apiFetch('/groups/');
  return toArray(data);
}