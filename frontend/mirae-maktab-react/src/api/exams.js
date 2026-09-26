import { apiFetch, toArray } from './client.js';

export async function fetchMyExams() {
  const data = await apiFetch('/exams/');
  return toArray(data);
}

export async function fetchMyExamResults() {
  const data = await apiFetch('/exam-results/');
  return toArray(data);
}

export function createExamResult(payload) {
  return apiFetch('/exam-results/', { method: 'POST', body: payload });
}