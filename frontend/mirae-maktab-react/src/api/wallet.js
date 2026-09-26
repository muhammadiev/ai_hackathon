import { apiFetch } from './client.js';

export function fetchWallet() {
  return apiFetch('/wallet/');
}

export function topupWithCode(code) {
  return apiFetch('/wallet/topup/code/', {
    method: 'POST',
    body: { code: String(code).trim() },
  });
}

export function fetchPaymentHistory() {
  return apiFetch('/payments/my-history/').catch(() => apiFetch('/wallet/history/'));
}
