import React, { useEffect, useState } from 'react'
import { fetchUsersAdmin, deleteUserAdmin } from '../api'

export default function AdminUsers(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load() }, [])

  async function load(){
    setLoading(true)
    const data = await fetchUsersAdmin()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleDelete(id){
    if(!window.confirm('Are you sure you want to remove this user? This will send them an email.')) return;
    const res = await deleteUserAdmin(id)
    if(res && res.error){ alert(res.error || 'Failed'); return }
    alert('User removed')
    load()
  }

  if(loading) return <div className="text-white p-6">Loading...</div>
  return (
    <div>
      <h2 className="text-white text-2xl mb-4">User Management</h2>
      <div className="bg-white/5 p-4 rounded">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Last Login</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t border-white/5">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                <td className="p-2">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'never'}</td>
                <td className="p-2">
                  <button onClick={()=>handleDelete(u._id)} className="px-3 py-1 bg-red-600 text-white rounded">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
