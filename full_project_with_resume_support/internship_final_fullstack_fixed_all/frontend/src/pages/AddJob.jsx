// frontend/src/pages/AddJob.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentUser } from '../api'

export default function AddJob() {
  const nav = useNavigate()
  const user = currentUser()

  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [location, setLocation] = useState('')
  const [stipend, setStipend] = useState('')

  if (!user || !['company', 'admin'].includes(user.role)) {
    return (
      <div className="text-white text-center text-xl p-10">
        You are not authorized to create jobs.
      </div>
    )
  }

  async function onSubmit(e){
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('http://localhost:5000/api/jobs', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ title, companyName, description, deadline, location, stipend })
    })
    const data = await res.json()
    if (res.ok) {
      alert("Job Created Successfully!")
      nav('/jobs')
    } else {
      alert(data.error || "Failed to create job")
      console.error("JOB CREATE ERROR:", data)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white/10 p-6 rounded-xl text-white">
      <h1 className="text-2xl font-bold mb-4">Create Job</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-3 bg-slate-800 rounded-md" placeholder="Job Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input className="w-full p-3 bg-slate-800 rounded-md" placeholder="Company Name" value={companyName} onChange={e=>setCompanyName(e.target.value)} required />
        <textarea className="w-full p-3 bg-slate-800 rounded-md" placeholder="Job Description" rows="4" value={description} onChange={e=>setDescription(e.target.value)} required />
        <input className="w-full p-3 bg-slate-800 rounded-md" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} required />
        <input className="w-full p-3 bg-slate-800 rounded-md" placeholder="Location (City, State)" value={location} onChange={e=>setLocation(e.target.value)} />
        <input className="w-full p-3 bg-slate-800 rounded-md" placeholder="Stipend (e.g. 10000 or Paid)" value={stipend} onChange={e=>setStipend(e.target.value)} />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Create</button>
      </form>
    </div>
  )
}
