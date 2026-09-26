import { apiFetch } from './client.js';

export function fetchTest(testId) {
  return apiFetch(`/tests/${testId}/`);
}

export function startAttempt(testId) {
  return apiFetch('/test-attempts/', { method: 'POST', body: { test: testId } });
}

export function submitAnswer(attemptId, payload) {
  return apiFetch(`/test-attempts/${attemptId}/submit-answer/`, { method: 'POST', body: payload });
}

export function finishAttempt(attemptId) {
  return apiFetch(`/test-attempts/${attemptId}/finish/`, { method: 'POST' });
}

export function fetchAttempt(attemptId) {
  return apiFetch(`/test-attempts/${attemptId}/`);
}