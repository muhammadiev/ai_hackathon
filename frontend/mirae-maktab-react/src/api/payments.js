import { apiFetch } from './client.js';

export function fetchMyPayments() {
  return apiFetch('/payments/my-history/');
}