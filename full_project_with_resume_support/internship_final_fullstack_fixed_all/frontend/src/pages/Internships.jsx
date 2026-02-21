import React, { useEffect, useState } from 'react'
import { fetchInternships, addInternship, currentUser } from '../api'

export default function Internships(){
  const [list, setList] = useState([])
  const [company, setCompany] = useState(''), [role, setRole] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState('')
  const user = currentUser()

  useEffect(()=>{ if(user) fetchInternships(user.userId).then(setList).catch(()=>setList([])) }, [user])

  async function onAdd(e){
    e.preventDefault()
    if(!user || user.role !== 'student') return alert('Login as student')
    await addInternship({ companyName: company, role, startDate: start, endDate: end })
    setCompany(''); setRole(''); setStart(''); setEnd('')
    fetchInternships(user.userId).then(setList)
  }

  function pill(status){
    if(status==='Pending') return 'bg-yellow-400 text-black'
    if(status==='Validated') return 'bg-green-500 text-white'
    return 'bg-red-600 text-white'
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/4">
          <h3 className="text-white font-semibold">Add Internship</h3>
          <form className="mt-4 space-y-3" onSubmit={onAdd}>
            <input className="w-full p-3 rounded-md bg-slate-800 text-white" placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} required />
            <input className="w-full p-3 rounded-md bg-slate-800 text-white" placeholder="Role" value={role} onChange={e=>setRole(e.target.value)} required />
            <div className="flex gap-2">
              <input type="date" className="w-1/2 p-3 rounded-md bg-slate-800 text-white" value={start} onChange={e=>setStart(e.target.value)} />
              <input type="date" className="w-1/2 p-3 rounded-md bg-slate-800 text-white" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <div><button className="px-4 py-2 rounded-md bg-indigo-600 text-white">Add Internship</button></div>
          </form>
        </div>

        <div className="p-6 rounded-xl bg-white/4">
          <h3 className="text-white font-semibold">Your Internships</h3>
          <div className="mt-4 space-y-3">
            {list.length===0 && <div className="text-slate-300">No internships logged yet.</div>}
            {list.map(it => (
              <div key={it._id} className="p-4 bg-slate-900 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{it.companyName}</div>
                  <div className="text-slate-400 text-sm">{it.role} • {it.startDate?it.startDate.slice(0,10):''} - {it.endDate?it.endDate.slice(0,10):''}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${pill(it.status)}`}>{it.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
