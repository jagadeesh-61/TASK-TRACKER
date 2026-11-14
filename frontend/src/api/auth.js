import client, { fetchCsrfCookie } from './client.js';

export async function getCurrentUser() {
  const { data } = await client.get('/api/user');
  return data.data;
}

export async function login(credentials) {
  await fetchCsrfCookie();
  const { data } = await client.post('/api/login', credentials);
  return data.data;
}

export async function register(details) {
  await fetchCsrfCookie();
  const { data } = await client.post('/api/register', details);
  return data.data;
}

export async function logout() {
  await client.post('/api/logout');
}
