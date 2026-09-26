import { apiFetch, toArray } from './client.js';

export async function fetchMyNotifications() {
  const data = await apiFetch('/notifications/');
  return toArray(data);
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/mark-read/`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return apiFetch('/notifications/mark-all-read/', { method: 'POST' });
}
