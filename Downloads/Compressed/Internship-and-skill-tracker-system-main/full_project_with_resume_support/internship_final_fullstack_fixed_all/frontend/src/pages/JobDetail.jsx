import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchJob, applyJob, currentUser } from '../api'

export default function JobDetail(){
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [show, setShow] = useState(false)
  const [cover, setCover] = useState('')
  const user = currentUser()

  useEffect(()=>{ fetchJob(id).then(setJob).catch(()=>setJob(null)) }, [id])

  async function onApply(){
    if(!user || user.role !== 'student'){ alert('Login as student'); return }
    const res = await applyJob(id, cover)
    if(res.error) alert(res.error); else { alert('Applied'); setShow(false) }
  }

  if(!job) return <div className="p-6 rounded-xl bg-white/5">Loading...</div>

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 p-6 rounded-xl bg-white/5">
        <h2 className="text-2xl font-bold text-white">{job.title}</h2>
        <div className="text-slate-300 mt-2">
          {job.companyName}
          {job.location && String(job.location).trim() !== '' && (
            <span className="mx-2">• Location: <span className="text-slate-200">{job.location}</span></span>
          )}
          {job.stipend && String(job.stipend).trim() !== '' && (
            <span className="mx-2">• Stipend: <span className="text-slate-200">{job.stipend}</span></span>
          )}
          <span className="mx-2">• Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'}</span>
        </div>
        <div className="mt-4 text-slate-200 whitespace-pre-line">{job.description}</div>
      </div>

      <aside className="p-6 rounded-xl bg-white/4">
        <div className="space-y-3">
          {/* Only show apply UI to students */}
          {user && user.role === 'student' ? (
            <>
              <button onClick={()=>setShow(true)} className="w-full bg-gradient-to-r from-indigo-500 to-sky-400 px-4 py-3 rounded-md text-white font-semibold shadow">Apply Now</button>
            </>
          ) : (
            <></>
          )}
        </div>
      </aside>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShow(false)} />
          <div className="relative bg-slate-900 rounded-xl p-6 w-full max-w-lg z-10">
            <h3 className="text-lg text-white font-bold">Apply for {job.title}</h3>
            <p className="text-slate-300 text-sm mt-1">Send a short cover note (optional)</p>
            <textarea className="w-full mt-3 p-3 rounded-md bg-slate-800 text-white" value={cover} onChange={e=>setCover(e.target.value)} />
            <div className="flex gap-3 mt-4 justify-end">
              <button className="px-4 py-2 rounded-md bg-white/6" onClick={()=>setShow(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-md bg-indigo-600 text-white" onClick={onApply}>Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
