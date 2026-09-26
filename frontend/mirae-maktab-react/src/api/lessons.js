import { apiFetch, toArray } from './client.js';

export async function fetchMySubjects() {
  const data = await apiFetch('/my-subjects/');
  return toArray(data);
}

export async function fetchTopics(subjectId) {
  const data = await apiFetch(`/topics/?subject=${subjectId}`);
  return toArray(data);
}

export function fetchTopicDetail(topicId) {
  return apiFetch(`/topics/${topicId}/`);
}