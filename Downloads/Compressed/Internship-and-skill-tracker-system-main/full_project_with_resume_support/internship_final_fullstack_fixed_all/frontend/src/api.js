// frontend/src/api.js
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

function getToken(){ return localStorage.getItem('token') || null }
function authHeaders(){ const token = getToken(); return token ? { Authorization: 'Bearer ' + token } : {} }

export async function login(email){
  const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export function setAuth(token, user){
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  try { window.dispatchEvent(new Event('auth')); } catch(e){}
}
export function logout(){
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  try { window.dispatchEvent(new Event('auth')); } catch(e){}
}
export function currentUser(){ const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null }

// Admin: fetch all users
export async function fetchUsersAdmin(){
  const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/users', { headers: authHeaders() });
  return res.json();
}

// Admin: delete a user by id
export async function deleteUserAdmin(userId){
  const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/auth/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

// Jobs
export async function fetchJobs(){ const res = await fetch(API_BASE + '/jobs', { headers: authHeaders() }); return res.json(); }
export async function fetchJob(id){ const res = await fetch(API_BASE + `/jobs/${id}`, { headers: authHeaders() }); return res.json(); }
export async function createJob(payload){
  const res = await fetch(API_BASE + '/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// Admin: delete a job and cascade related data
export async function deleteJob(jobId){
  const res = await fetch(API_BASE + `/jobs/${jobId}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}

// Applications (student)
export async function applyJob(jobId, coverLetter, resumeUrl=''){
  const res = await fetch(API_BASE + '/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ jobId, coverLetter, resumeUrl })
  });
  return res.json();
}

// Application helpers
export async function fetchMyApplications(){
  const res = await fetch(API_BASE + '/applications/me', { headers: authHeaders() });
  return res.json();
}
export async function fetchCompanyApplications(){
  const res = await fetch(API_BASE + '/applications/for-company', { headers: authHeaders() });
  return res.json();
}
export async function fetchAllApplications(){ // admin only
  const res = await fetch(API_BASE + '/applications', { headers: authHeaders() });
  return res.json();
}
export async function decideApplication(applicationId, action, feedback = ''){
  const res = await fetch(API_BASE + `/applications/${applicationId}/decision`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action, feedback })
  });
  return res.json();
}

// Download resume for an application. Returns { blob, filename }
export async function downloadResume(applicationId){
  const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/applications/${applicationId}/resume`, {
    headers: authHeaders()
  });
  if (!res.ok) {
    const body = await res.json().catch(()=>null);
    throw new Error((body && (body.error||body.message)) || `Download failed: ${res.status}`);
  }

  const disposition = res.headers.get('content-disposition') || '';
  let filename = 'resume';
  const m = disposition.match(/filename="?([^";]+)"?/);
  if (m && m[1]) filename = m[1];

  const blob = await res.blob();
  return { blob, filename };
}

// Internships (existing)
export async function fetchInternships(studentId){ const q = studentId ? `?studentId=${studentId}` : ''; const res = await fetch(API_BASE + '/internships' + q, { headers: authHeaders() }); return res.json(); }
export async function addInternship(payload){ const res = await fetch(API_BASE + '/internships', { method:'POST', headers: { 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(payload) }); return res.json(); }
export async function fetchPendingInternships(){ const res = await fetch(API_BASE + '/internships?status=Pending', { headers: authHeaders() }); return res.json(); }
export async function validateInternship(id, action){ const res = await fetch(API_BASE + `/internships/${id}/validate`, { method:'PUT', headers: { 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ action }) }); return res.json(); }
export async function fetchUsers(){ const res = await fetch(API_BASE + '/auth/users', { headers: authHeaders() }); return res.json(); }
