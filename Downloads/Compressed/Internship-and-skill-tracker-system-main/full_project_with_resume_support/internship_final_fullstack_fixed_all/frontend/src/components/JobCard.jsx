// frontend/src/components/JobCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplyModal from '../components/ApplyModal';
import { currentUser } from '../api';
import { deleteJob } from '../api';

export default function JobCard({ job }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  if (!job) return null;

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a button
    if (e.target.closest('button')) return;
    navigate(`/jobs/${job._id}`);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="job-card rounded-lg bg-slate-800 p-6 shadow-md cursor-pointer hover:bg-slate-700 transition-colors"
      >
        <h3 className="text-xl font-semibold text-white">{job.companyName || job.company || job.title || 'Company'}</h3>
        <p className="mt-2 text-sm text-slate-300">{job.title || job.role || ''}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
          {job.location && String(job.location).trim() !== '' && (
            <span className="px-2 py-1 bg-slate-700 rounded">Location: {job.location}</span>
          )}
          {job.stipend && String(job.stipend).trim() !== '' && (
            <span className="px-2 py-1 bg-slate-700 rounded">Stipend: {job.stipend}</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</div>

          {/* Show Apply only to students */}
          {currentUser()?.role === 'student' ? (
            <button
              onClick={() => setOpen(true)}
              disabled={applying}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          ) : null}
          {/* Admin: delete job */}
          {currentUser()?.role === 'admin' && (
            <button
              onClick={async ()=>{
                if(!window.confirm('Delete this job and all related data?')) return;
                const res = await deleteJob(job._id);
                if(res && res.error) { alert(res.error || 'Delete failed'); return }
                alert('Job removed');
                window.location.reload();
              }}
              className="ml-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >Delete</button>
          )}
        </div>
      </div>

      {open && (
        <ApplyModal
          jobId={job._id || job.id}
          onClose={() => setOpen(false)}
          onSuccess={(data) => {
            setOpen(false);
            setApplying(false);
            // simple toast — replace with your toast if present
            try { alert('Application submitted successfully'); } catch(e) {}
            // optional: refresh page or update UI
            console.log('applied', data);
          }}
          // optional: show loading state while ApplyModal handles submit
          onSubmitting={() => setApplying(true)}
        />
      )}
    </>
  );
}
