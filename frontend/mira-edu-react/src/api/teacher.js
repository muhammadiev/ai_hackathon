/**
 * Teacher-facing API modules — map UI areas to /api/v1 endpoints.
 * All paths relative to API_V1. Use studentId never display name.
 */
import { apiFetch, toArray, qs } from "./client.js";

/* ── Classes & catalog ─────────────────────────────────────── */
export async function fetchClasses() {
  return toArray(await apiFetch("/classes/"));
}
export async function fetchClassStudents(classId) {
  return toArray(await apiFetch(`/classes/${classId}/students/`));
}
export async function fetchSubjects() {
  return toArray(await apiFetch("/subjects/"));
}
export async function fetchTeacherAssignments() {
  return toArray(await apiFetch("/teacher-assignments/"));
}

/* ── Questions ─────────────────────────────────────────────── */
export async function fetchQuestions(params = {}) {
  return toArray(await apiFetch(`/questions/${qs(params)}`));
}
export function createQuestion(payload) {
  return apiFetch("/questions/", { method: "POST", body: payload });
}
export function updateQuestion(id, payload) {
  return apiFetch(`/questions/${id}/`, { method: "PATCH", body: payload });
}
export function publishQuestion(id) {
  return apiFetch(`/questions/${id}/publish/`, { method: "POST", body: {} });
}
export function archiveQuestion(id) {
  return apiFetch(`/questions/${id}/archive/`, { method: "POST", body: {} });
}

/* ── Assignments ───────────────────────────────────────────── */
export async function fetchAssignments(params = {}) {
  return toArray(await apiFetch(`/assignments/${qs(params)}`));
}
export function fetchAssignment(id) {
  return apiFetch(`/assignments/${id}/`);
}
export function createAssignment(payload) {
  return apiFetch("/assignments/", { method: "POST", body: payload });
}
/** Prefer batch for multi-class fan-out */
export function createAssignmentBatch(payload) {
  return apiFetch("/assignment-batches/", {
    method: "POST",
    body: payload,
  });
}
export function publishAssignment(id) {
  return apiFetch(`/assignments/${id}/publish/`, { method: "POST", body: {} });
}
export async function fetchAssignmentResults(id) {
  return toArray(await apiFetch(`/assignments/${id}/results/`));
}

/* ── Paper / scans ─────────────────────────────────────────── */
export function createPaperBatch(payload) {
  return apiFetch("/paper/batches/", { method: "POST", body: payload });
}
export function uploadScan(batchId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch(`/paper/batches/${batchId}/scans/`, {
    method: "POST",
    body: fd,
    isFormData: true,
  });
}
export function confirmScan(scanId, payload) {
  return apiFetch(`/paper/scans/${scanId}/confirm/`, {
    method: "POST",
    body: payload,
  });
}

/* ── Telegram ──────────────────────────────────────────────── */
export async function fetchTelegramInbox(params = {}) {
  return toArray(await apiFetch(`/telegram/inbox/${qs(params)}`));
}
export function assignTelegramSubmission(id, payload) {
  return apiFetch(`/telegram/inbox/${id}/assign/`, {
    method: "POST",
    body: payload,
  });
}
export function aiGradeTelegram(id) {
  return apiFetch(`/telegram/inbox/${id}/ai-grade/`, {
    method: "POST",
    body: {},
  });
}
export function confirmTelegramGrade(id, payload) {
  return apiFetch(`/telegram/inbox/${id}/confirm-grade/`, {
    method: "POST",
    body: payload,
  });
}

/* ── Understanding flags ───────────────────────────────────── */
export async function fetchUnderstandingFlags(params = {}) {
  return toArray(await apiFetch(`/understanding/flags/${qs(params)}`));
}
export function resolveUnderstandingFlag(id, payload) {
  return apiFetch(`/understanding/flags/${id}/resolve/`, {
    method: "POST",
    body: payload,
  });
}

/* ── Effectiveness ─────────────────────────────────────────── */
export function createEffectivenessBaseline(payload) {
  return apiFetch("/effectiveness/baselines/", {
    method: "POST",
    body: payload,
  });
}
export function fetchBeforeAfter(params) {
  return apiFetch(`/effectiveness/before-after/${qs(params)}`);
}
export function fetchAbReport(params) {
  return apiFetch(`/effectiveness/ab/${qs(params)}`);
}
export function fetchDirectorSummary(params = {}) {
  return apiFetch(`/effectiveness/director-summary/${qs(params)}`);
}

/* ── Mastery ───────────────────────────────────────────────── */
export function fetchClassMastery(classId, params = {}) {
  return apiFetch(`/mastery/class/${classId}/${qs(params)}`);
}

/* ── Parent tips ───────────────────────────────────────────── */
export function linkParent(payload) {
  return apiFetch("/parents/links/", { method: "POST", body: payload });
}
export function generateParentTip(payload) {
  return apiFetch("/parents/tips/generate/", {
    method: "POST",
    body: payload,
  });
}
export async function fetchParentTips(params = {}) {
  return toArray(await apiFetch(`/parents/tips/${qs(params)}`));
}

/* ── Creator / earnings ────────────────────────────────────── */
export function fetchCreatorMe() {
  return apiFetch("/creator/me/");
}
export function fetchTwinEarnings(params = {}) {
  return apiFetch(`/staff/twin-earnings/${qs(params)}`);
}
export function completePack(id) {
  return apiFetch(`/kelajak/acceleration-packs/${id}/complete/`, {
    method: "POST",
    body: {},
  });
}

/* ── AI ────────────────────────────────────────────────────── */
export function createAiJob(payload) {
  return apiFetch("/ai/generation-jobs/", { method: "POST", body: payload });
}
export function fetchAiJob(id) {
  return apiFetch(`/ai/generation-jobs/${id}/`);
}

/* ── Dashboard ─────────────────────────────────────────────── */
export function fetchStaffDashboard(params = {}) {
  return apiFetch(`/dashboard/${qs(params)}`);
}

/* ── Game portal ───────────────────────────────────────────── */
export function fetchGameStatus() {
  return apiFetch("/game/status/");
}
