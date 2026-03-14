import axios from 'axios';

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

if (import.meta.env.DEV) {
  console.info(`[API] Using backend base URL: ${normalizedBaseUrl}`);
}

export const api = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 10000
});
