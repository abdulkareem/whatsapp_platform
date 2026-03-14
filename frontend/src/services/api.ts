import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

export const api = axios.create({
  baseURL: normalizedBaseUrl
});
