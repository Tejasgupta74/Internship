// frontend/src/pages/MyApplications.jsx
import React, { useEffect, useState } from 'react';
import { fetchMyApplications, downloadResume } from '../api';
import { currentUser } from '../api';

function StatusBadge({ status }) {
  const cls = status === 'Accepted' ? 'bg-green-600' : status === 'Rejected' ? 'bg-red-600' : 'bg-yellow-600';
  return <span className={`inline-block px-2 py-1 rounded ${cls} text-white text-sm`}>{status}</span>;
}

export default function MyApplications(){
  const [apps, setApps] = useState([]);
  useEffect(()=> { load() }, []);

  async function load(){
    const data = await fetchMyApplications();
    setApps(Array.isArray(data) ? data : []);
  }

  if(!apps.length) return <div className="text-white p-6">You have not applied to any jobs yet.</div>;

  return (
    <div>
      <h2 className="text-white text-2xl mb-4">My Applications</h2>
      {apps.map(a=>(
        <div key={a._id} className="p-4 bg-white/5 rounded mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-white font-bold">{a.job?.title || '—'}</div>
              <div className="text-slate-300">Company: {a.job?.companyName || '—'}</div>
              <div className="text-slate-200 mt-2">Cover: {a.coverLetter || '—'}</div>
              
              {a.feedback && (
                <div className="mt-3 p-3 bg-slate-800 rounded">
                  <div className="text-indigo-400 text-sm font-semibold mb-1">Feedback from Company:</div>
                  <div className="text-slate-200 text-sm whitespace-pre-wrap">{a.feedback}</div>
                </div>
              )}
            </div>
            <div className="text-right ml-4">
              <StatusBadge status={a.status} />
              <div className="text-slate-400 text-sm mt-2">{new Date(a.createdAt).toLocaleString()}</div>
              { (a.resumeFileId || a.resume || a.resumeUrl) && (
                <div className="mt-2">
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
                  }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Download Resume</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
