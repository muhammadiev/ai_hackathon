import { apiFetch } from './client.js';

export function syncOfflineBatch(clientBatchId, items) {
  return apiFetch('/offline/sync/', {
    method: 'POST',
    body: { client_batch_id: clientBatchId, items },
  });
}
