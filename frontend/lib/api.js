const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Low-level fetch wrapper used by every API helper below.
 * - Always sends/expects JSON.
 * - Attaches `Authorization: Bearer <token>` when a token is provided.
 * - Throws a regular Error with the server's message so callers can
 *   show it directly in the UI (try/catch + setError(err.message)).
 */
async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the API at ${API_URL}. Is the backend running and is NEXT_PUBLIC_API_URL set correctly?`
    );
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }

  return data;
}

// --- Auth ---
export const registerUser = (payload) => request('/api/auth/register', { method: 'POST', body: payload });
export const loginUser = (payload) => request('/api/auth/login', { method: 'POST', body: payload });
export const fetchMe = (token) => request('/api/auth/me', { token });

// --- Trips ---
export const fetchTrips = (token) => request('/api/trips', { token });
export const fetchTrip = (token, id) => request(`/api/trips/${id}`, { token });
export const createTrip = (token, payload) => request('/api/trips', { method: 'POST', body: payload, token });
export const deleteTrip = (token, id) => request(`/api/trips/${id}`, { method: 'DELETE', token });

export const addActivity = (token, tripId, payload) =>
  request(`/api/trips/${tripId}/activities`, { method: 'POST', body: payload, token });

export const removeActivity = (token, tripId, activityId) =>
  request(`/api/trips/${tripId}/activities/${activityId}`, { method: 'DELETE', token });

export const regenerateDay = (token, tripId, payload) =>
  request(`/api/trips/${tripId}/regenerate-day`, { method: 'POST', body: payload, token });

export const togglePackingItem = (token, tripId, itemId, isPacked) =>
  request(`/api/trips/${tripId}/packing/${itemId}`, { method: 'PATCH', body: { isPacked }, token });

export const regeneratePackingList = (token, tripId) =>
  request(`/api/trips/${tripId}/packing/regenerate`, { method: 'POST', token });

export const fetchHealth = () => request('/api/health');

export { API_URL };
