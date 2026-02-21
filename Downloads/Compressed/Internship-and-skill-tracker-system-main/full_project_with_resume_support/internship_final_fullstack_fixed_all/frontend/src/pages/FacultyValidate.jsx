import React, { useEffect, useState } from 'react'
import { fetchPendingInternships, validateInternship, currentUser } from '../api'

export default function FacultyValidate(){
  const [pending, setPending] = useState([])
  const user = currentUser()

  useEffect(()=>{ fetchData() }, [])

  async function fetchData(){ const p = await fetchPendingInternships(); setPending(p || []) }
  async function doAction(id, action){
    if(!user || user.role !== 'faculty') return alert('Login as faculty')
    await validateInternship(id, action)
    fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Faculty — Validate Internships</h1>
      <div className="p-6 rounded-xl bg-white/4">
        {pending.length === 0 ? <div className="text-slate-300">No pending internships.</div> : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-sm">
                <th className="p-3">Student</th>
                <th className="p-3">Company</th>
                <th className="p-3">Role</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(p => (
                <tr key={p._id} className="border-t border-white/5">
                  <td className="p-3">
                    <div className="font-semibold text-white">{p.student?.name}</div>
                    <div className="text-slate-400 text-sm">{p.student?.email}</div>
                  </td>
                  <td className="p-3">{p.companyName}</td>
                  <td className="p-3">{p.role}</td>
                  <td className="p-3">{p.startDate? p.startDate.slice(0,10):''} - {p.endDate? p.endDate.slice(0,10):''}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-md bg-green-600 text-white text-sm" onClick={()=>doAction(p._id,'validate')}>Validate</button>
                      <button className="px-3 py-1 rounded-md bg-red-600 text-white text-sm" onClick={()=>doAction(p._id,'reject')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
