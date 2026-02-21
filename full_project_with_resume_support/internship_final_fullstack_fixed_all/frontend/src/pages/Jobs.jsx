import React, { useEffect, useState } from 'react'
import JobCard from '../components/JobCard'
import { fetchJobs } from '../api'

export default function Jobs(){
  const [jobs, setJobs] = useState([])
  useEffect(()=>{ fetchJobs().then(setJobs).catch(()=>setJobs([])) }, [])
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Open Internships</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {jobs.length===0 && <div className="col-span-3 p-8 rounded-xl bg-white/5 text-slate-300">No open jobs</div>}
        {jobs.map(j => (<JobCard key={j._id} job={j} />))}
      </div>
    </div>
  )
}
