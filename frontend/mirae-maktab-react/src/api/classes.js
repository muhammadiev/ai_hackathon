import { apiFetch } from './client.js';
export function fetchMyClass() {
  return apiFetch('/classes/me/');
}
export function fetchMyLeaderboard() {
  return apiFetch('/classes/me/leaderboard/').catch(() => null);
}
export function fetchMyTimetable() {
  return apiFetch('/classes/me/timetable/').catch(() => null);
}
