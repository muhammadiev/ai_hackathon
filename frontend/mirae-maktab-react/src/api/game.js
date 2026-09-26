import { apiFetch } from './client.js';

export function fetchGameStatus() {
  return apiFetch('/game/status/');
}

/** Create portal session — server returns signed payload / launch url */
export function createGameSession(payload) {
  // { gametype: 'simple'|'homework', homework_id?, ... } — no role
  return apiFetch('/game/sessions/', { method: 'POST', body: payload });
}
