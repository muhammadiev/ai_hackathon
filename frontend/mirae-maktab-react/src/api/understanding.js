import { apiFetch, toArray } from './client.js';

export async function fetchPendingUnderstanding() {
  try {
    const data = await apiFetch('/understanding/pending/');
    return toArray(data);
  } catch {
    return [];
  }
}

export function submitUnderstandingAnswer(id, payload) {
  return apiFetch(`/understanding/${id}/answer/`, {
    method: 'POST',
    body: {
      answer: payload?.answer ?? '',
      timed_out: !!payload?.timed_out,
    },
  });
}
