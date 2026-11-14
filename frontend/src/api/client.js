import axios from 'axios';

/**
 * Single axios instance for the Laravel API.
 * - withCredentials: send the session cookie.
 * - withXSRFToken: copy Laravel's XSRF-TOKEN cookie into the X-XSRF-TOKEN
 *   header on every request (CSRF protection).
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let onUnauthenticated = null;

export function setUnauthenticatedHandler(handler) {
  onUnauthenticated = handler;
}

export function fetchCsrfCookie() {
  return client.get('/sanctum/csrf-cookie');
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // 419 = CSRF token expired/missing: get a fresh cookie and retry once.
    if (response?.status === 419 && config && !config._csrfRetried) {
      config._csrfRetried = true;
      await fetchCsrfCookie();
      return client(config);
    }

    if (response?.status === 401 && onUnauthenticated) {
      onUnauthenticated();
    }

    return Promise.reject(error);
  },
);

/** A user-friendly message for any failed request. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Cannot reach the server. Please check that the API is running.';
  }
  const { status, data } = error.response;
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'Something went wrong on the server. Please try again later.';
  return data?.message || fallback;
}

/** Laravel 422 errors → { field: 'first message' }. */
export function getFieldErrors(error) {
  if (error?.response?.status !== 422) return {};
  const errors = error.response.data?.errors ?? {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ]),
  );
}

export default client;
