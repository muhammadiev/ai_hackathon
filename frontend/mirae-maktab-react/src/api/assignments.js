import { apiFetch, toArray } from './client.js';

export async function fetchAssignments(params = {}) {
  const q = new URLSearchParams(params).toString();
  const data = await apiFetch(`/assignments/${q ? `?${q}` : ''}`);
  return toArray(data);
}

export function fetchAssignment(id) {
  return apiFetch(`/assignments/${id}/`);
}
