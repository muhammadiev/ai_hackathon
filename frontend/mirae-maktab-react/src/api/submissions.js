import { apiFetch, toArray } from './client.js';

/** Start a test / homework attempt — server owns scoring */
export function startSubmission(payload) {
  // payload: { assignment_id?, subject_id?, size?, kind? } — no score, no role
  return apiFetch('/submissions/start/', { method: 'POST', body: payload });
}

export function submitAnswer(submissionId, payload) {
  return apiFetch(`/submissions/${submissionId}/answer/`, {
    method: 'POST',
    body: payload,
  }).catch(() =>
    apiFetch(`/submissions/${submissionId}/submit-answer/`, {
      method: 'POST',
      body: payload,
    })
  );
}

export function finishSubmission(submissionId, payload) {
  // optional body for answers batch; server computes score
  return apiFetch(`/submissions/${submissionId}/finish/`, {
    method: 'POST',
    body: payload || {},
  });
}

export async function fetchMySubmissions(params = {}) {
  const q = new URLSearchParams(params).toString();
  const data = await apiFetch(`/submissions/${q ? `?${q}` : ''}`);
  return toArray(data);
}

export function fetchSubmission(id) {
  return apiFetch(`/submissions/${id}/`);
}

export function uploadSubmissionFile(submissionId, file, fileType = 'answer') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  return apiFetch(`/submissions/${submissionId}/upload-file/`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}
