// frontend/src/components/ApplyModal.jsx
import React, { useState } from 'react';

export default function ApplyModal({ jobId, onClose = () => {}, onSuccess = () => {}, onSubmitting = () => {} }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine API base URL safely. Prefer Vite (`import.meta.env.VITE_API_URL`), then CRA (`process.env.REACT_APP_API_URL`),
  // otherwise fallback to localhost. Use guarded checks so this file can run in various environments.
  const getApiBase = () => {
    const DEFAULT = 'http://localhost:5000';

    // CRA / Create React App
    try {
      if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
    } catch (e) {
      // ignore
    }

    // Vite: access import.meta.env inside try/catch. Bundlers that support it will return the value.
    try {
      if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
    } catch (e) {
      // ignore if import.meta isn't supported in this environment
    }

    // Allow overriding at runtime via global if needed
    try {
      if (typeof window !== 'undefined' && window.__API_BASE__) return window.__API_BASE__;
    } catch (e) {}

    return DEFAULT;
  };

  const API_BASE = getApiBase();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!jobId) {
      setError('Missing job id.');
      return;
    }

    // Two-step: upload file to GridFS then create application with JSON

    // Basic client-side validation for resume file
    if (file) {
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) {
        setError('Resume exceeds 5MB size limit.');
        return;
      }
      if (file.type && file.type !== 'application/pdf') {
        setError('Resume must be a PDF file.');
        return;
      }
    }

    setLoading(true);
    try {
      if (onSubmitting) {
        try { onSubmitting(); } catch (e) {}
      }

      const token = localStorage.getItem('token');

      let resumeFileId = null;
      let resumeOriginalName = '';

      if (file) {
        const uploadUrl = `${API_BASE.replace(/\/$/, '')}/api/applications/upload-resume`;
        const uploadForm = new FormData();
        uploadForm.append('resume', file);

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer ' + token } : undefined,
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          let em = `Upload failed: ${uploadRes.status}`;
          try { const b = await uploadRes.json().catch(()=>null); if (b) em = b.error || b.message || JSON.stringify(b); } catch(e){}
          throw new Error(em);
        }
        const upData = await uploadRes.json();
        resumeFileId = upData.fileId;
        resumeOriginalName = upData.originalName || upData.filename || file.name;
      }

      const url = `${API_BASE.replace(/\/$/, '')}/api/applications`;

      const body = {
        jobId,
        coverLetter: coverLetter || undefined,
        resumeFileId: resumeFileId || undefined,
        resumeOriginalName: resumeOriginalName || undefined,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errMsg = `Request failed: ${res.status}`;
        try {
          const body = await res.json().catch(() => null);
          if (body) errMsg = body.error || body.message || JSON.stringify(body);
        } catch (e) {
          const txt = await res.text().catch(() => null);
          if (txt) errMsg = txt;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Apply error', err);
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-white">Apply for this job</h3>

        <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Cover note (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows="5"
              className="w-full rounded bg-slate-700 p-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              placeholder="Write a short cover note..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Upload resume (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-200"
            />
            <p className="mt-1 text-xs text-slate-400">Max 5MB. PDF only.</p>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
