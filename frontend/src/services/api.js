/**
 * API Service Client
 * Responsibility: Centralized HTTP/REST client for communicating with the backend API
 * (upload endpoints, inference triggers, task status polling, and telemetry data).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadImage(formData) {
  // Placeholder: send image file to backend upload route
  return { status: 'not_implemented' };
}

export async function runInference(payload) {
  // Placeholder: trigger super-resolution inference on target image
  return { status: 'not_implemented' };
}

export async function checkStatus(taskId) {
  // Placeholder: poll status of an asynchronous super-resolution job
  return { status: 'not_implemented' };
}
