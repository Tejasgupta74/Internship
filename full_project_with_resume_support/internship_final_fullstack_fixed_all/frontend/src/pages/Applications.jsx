// frontend/src/pages/Applications.jsx
import React, { useEffect, useState } from 'react';
import { fetchCompanyApplications, fetchAllApplications, decideApplication, downloadResume, currentUser } from '../api';

export default function Applications(){
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const user = currentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(()=> { load(); }, [showAll]);

  async function load(){
    setLoading(true);
    const data = showAll ? await fetchAllApplications() : await fetchCompanyApplications();
    setApps(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleDecision(id, action){
    const feedback = feedbacks[id] || '';
    
    if(!window.confirm(`Are you sure you want to ${action} this application?`)) return;

    // Optimistic UI: remove item locally
    setApps(prev => prev.filter(a => a._id !== id));

    const res = await decideApplication(id, action, feedback);
    if (res && res.error) {
      alert(res.error || 'Failed');
      // rollback by reloading
      load();
      return;
    }
    // success — the item was removed optimistically
    alert('Decision saved and feedback sent to student');
    // Clear feedback for this application
    setFeedbacks(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }

  if(loading) return <div className="text-white p-6">Loading...</div>;
  if(!apps.length) return <div className="text-white p-6">No applications found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-2xl">Applications {isAdmin && '(View Only)'}</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={()=>{ setShowAll(s=>!s); }} className="px-3 py-1 bg-white/6 rounded">
              {showAll ? 'Show Pending' : 'Show All'}
            </button>
          )}
          <button onClick={load} className="px-3 py-1 bg-white/6 rounded">Refresh</button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/50 rounded text-yellow-200 text-sm">
          <strong>Admin View:</strong> You can view all applications but cannot accept or reject them. Only companies can make decisions on their applications.
        </div>
      )}

      <div className="space-y-4">
        {apps.map(a => (
          <div key={a._id} className="p-4 bg-white/5 rounded">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="text-white font-bold">{a.job?.title || '—'}</div>
                <div className="text-slate-300">Student: {a.student?.name || a.student}</div>
                <div className="text-slate-300 text-sm">Email: {a.student?.email || ''}</div>
                <div className="mt-2 text-slate-200">Cover letter: {a.coverLetter || '—'}</div>
                <div className="mt-1 text-slate-400 text-sm">Status: {a.status}</div>
                
                {!isAdmin && (
                  <div className="mt-4">
                    <label className="block text-slate-300 text-sm mb-1">Feedback to Student:</label>
                    <textarea
                      value={feedbacks[a._id] || ''}
                      onChange={(e) => setFeedbacks(prev => ({ ...prev, [a._id]: e.target.value }))}
                      placeholder="Provide feedback about the application (optional)..."
                      className="w-full p-3 rounded-md bg-slate-800 text-white resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-slate-400 mt-1">This feedback will be sent to the student via email</p>
                  </div>
                )}
                
                {isAdmin && a.feedback && (
                  <div className="mt-3 p-3 bg-slate-800 rounded">
                    <div className="text-indigo-400 text-sm font-semibold mb-1">Feedback from Company:</div>
                    <div className="text-slate-200 text-sm whitespace-pre-wrap">{a.feedback}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {!isAdmin && (
                  <>
                    <button onClick={()=>handleDecision(a._id, 'accept')} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
                    <button onClick={()=>handleDecision(a._id, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                  </>
                )}
                <button onClick={async ()=>{
                    try {
                      const { blob, filename } = await downloadResume(a._id);
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = filename || 'resume.pdf';
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert(err.message || 'Failed to download');
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Download Resume</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
