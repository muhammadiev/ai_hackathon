import { apiFetch, toArray } from './client.js';

export function fetchAssignment(id) {
  return apiFetch(`/assignments/${id}/`);
}

export async function fetchMyAssignments() {
  const data = await apiFetch('/assignments/');
  return toArray(data);
}

export async function fetchMySubmissions() {
  const data = await apiFetch('/submissions/');
  return toArray(data);
}

export function createSubmission(payload) {
  return apiFetch('/submissions/', { method: 'POST', body: payload });
}

export function uploadSubmissionFile(submissionId, file, fileType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  return apiFetch(`/submissions/${submissionId}/upload-file/`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}