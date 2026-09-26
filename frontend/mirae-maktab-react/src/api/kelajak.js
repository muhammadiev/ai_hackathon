import { apiFetch, toArray } from './client.js';

export function fetchTwin() {
  return apiFetch('/kelajak/twin/');
}

export function recomputeTwin() {
  return apiFetch('/kelajak/twin/', { method: 'POST', body: {} }).catch(() =>
    apiFetch('/kelajak/twin/recompute/', { method: 'POST', body: {} })
  );
}

export async function fetchProposedPacks() {
  try {
    const data = await apiFetch('/kelajak/acceleration-packs/proposed/');
    return toArray(data);
  } catch {
    return [];
  }
}

export async function fetchPackHistory() {
  try {
    const data = await apiFetch('/kelajak/acceleration-packs/history/');
    return toArray(data);
  } catch {
    return [];
  }
}

export function purchasePack(id) {
  return apiFetch(`/kelajak/acceleration-packs/${id}/purchase/`, { method: 'POST' });
}
