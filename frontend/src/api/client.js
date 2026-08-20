const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('kopargaon_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('kopargaon_token', token);
  else localStorage.removeItem('kopargaon_token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('kopargaon_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('kopargaon_user', JSON.stringify(user));
  else localStorage.removeItem('kopargaon_user');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data;
}

// Separate path for file uploads — do NOT set Content-Type manually here;
// the browser needs to set it itself so it includes the multipart boundary.
async function requestMultipart(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const api = {
  // Add this inside the api object in src/api/client.js
  resolveFlag: (flagId, { action, comment }) => 
  request(`/flags/${flagId}/resolve`, { method: 'POST', body: { action, comment } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),

  listUsers: (role) => request(`/users${role ? `?role=${role}` : ''}`),

  listProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (payload) => request('/projects', { method: 'POST', body: payload }),

  // Updated to include budgetSpent
  submitMilestone: (projectId, { title, progressPercent, budgetSpent, note, photoFile }) => {
    const form = new FormData();
    form.append('title', title);
    form.append('progressPercent', progressPercent);
    if (budgetSpent !== undefined && budgetSpent !== null) form.append('budgetSpent', budgetSpent);
    if (note) form.append('note', note);
    if (photoFile) form.append('photo', photoFile);
    return requestMultipart(`/projects/${projectId}/milestones`, form);
  },

  // Alias so calling api.createMilestone works with either FormData or an object!
  createMilestone: (projectId, payload) => {
    if (payload instanceof FormData) {
      return requestMultipart(`/projects/${projectId}/milestones`, payload);
    }
    return api.submitMilestone(projectId, payload);
  },

  verifyMilestone: (id, comment) => request(`/milestones/${id}/verify`, { method: 'POST', body: { comment } }),
  rejectMilestone: (id, comment) => request(`/milestones/${id}/reject`, { method: 'POST', body: { comment } }),
  
  flagMilestone: (id, { text, photoFile }) => {
    const form = new FormData();
    form.append('text', text);
    if (photoFile) form.append('photo', photoFile);
    return requestMultipart(`/milestones/${id}/flags`, form);
  },

  // NEW: Resolve flag endpoint for Authorities / Engineers
  resolveFlag: (flagId, { action, resolutionNote }) => 
    request(`/flags/${flagId}/resolve`, { method: 'POST', body: { action, resolutionNote } }),

  getAuditTrail: (projectId) => request(`/projects/${projectId}/audit-trail`),

  listDemands: () => request('/demands'),
  createDemand: ({ title, ward, category, description, photoFile }) => {
    const form = new FormData();
    form.append('title', title);
    form.append('ward', ward);
    form.append('category', category);
    if (description) form.append('description', description);
    if (photoFile) form.append('photo', photoFile);
    return requestMultipart('/demands', form);
  },
  voteDemand: (id) => request(`/demands/${id}/vote`, { method: 'POST' }),
  linkDemand: (id, projectId) => request(`/demands/${id}/link`, { method: 'POST', body: { projectId } }),

  listDiscussion: (projectId) => request(`/projects/${projectId}/discussion`),
  postDiscussion: (projectId, { content, category }) =>
    request(`/projects/${projectId}/discussion`, { method: 'POST', body: { content, category } }),
  getDiscussionSummary: (projectId) => request(`/projects/${projectId}/discussion/summary`),

  fileUrl: (relativePath) => (relativePath ? `${API_BASE}${relativePath}` : null),
  // Add inside api object in frontend/src/api/client.js:
  createUser: (payload) => request('/users', { method: 'POST', body: payload })
};