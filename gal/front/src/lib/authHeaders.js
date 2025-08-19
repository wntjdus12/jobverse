// front/src/lib/authHeaders.js
export function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  let userId = null;
  try {
    const rawUser = sessionStorage.getItem("user");
    userId = rawUser ? JSON.parse(rawUser)._id : null;
  } catch {
    userId = null;
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers["X-User-Id"] = userId;
  return headers;
}
