import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../api' // must exist in api.js

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function Signup(){
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' })
  const [emailError, setEmailError] = useState('')
  const [adminExists, setAdminExists] = useState(false)
  const nav = useNavigate()

  React.useEffect(() => {
    // Check if admin already exists
    const checkAdmin = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
        const res = await fetch(base + '/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (res.ok) {
          const users = await res.json()
          const hasAdmin = users.some(u => u.role === 'admin')
          setAdminExists(hasAdmin)
        }
      } catch (err) {
        console.log('Could not check admin status')
      }
    }
    checkAdmin()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validate email format in real-time
    if (name === 'email') {
      if (value && !isValidEmail(value)) {
        setEmailError('Invalid email format')
      } else {
        setEmailError('')
      }
    }
  }

  async function onSubmit(e){
    e.preventDefault()
    
    // Validate email before submission
    if (!isValidEmail(formData.email)) {
      setEmailError('Please enter a valid email address')
      alert('Invalid email format')
      return
    }
    
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      console.log('Signup response status:', res.status)
      const data = await res.json()
      console.log('Signup response data:', data)
      if (data.error) {
        if (data.error.includes('email')) {
          setEmailError(data.error)
        }
        alert(data.error)
        return
      }
      if (data.token && data.user) {
        setAuth(data.token, data.user)
        nav('/')
      } else {
        alert('Signup successful — please login')
        nav('/login')
      }
    } catch (err) {
      console.error('Signup error', err)
      alert('Signup failed — check console')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="p-6 rounded-xl bg-white/4">
        <h2 className="text-xl font-bold text-white mb-2">Create an account</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="name"
            required value={formData.name} onChange={handleChange}
            placeholder="Full name"
            className="w-full p-3 rounded-md bg-slate-800 text-white" />
          <div>
            <input
              name="email"
              required type="email" value={formData.email} onChange={handleChange}
              placeholder="email@example.com"
              className={`w-full p-3 rounded-md bg-slate-800 text-white ${
                emailError ? 'border-2 border-red-500' : ''
              }`} />
            {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
          </div>
          <input
            name="password"
            required type="password" value={formData.password} onChange={handleChange}
            placeholder="Choose a password"
            className="w-full p-3 rounded-md bg-slate-800 text-white" />
          <select
            name="role"
            value={formData.role} onChange={handleChange}
            className="w-full p-3 rounded-md bg-slate-800 text-white">
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="company">Company</option>
            {!adminExists && <option value="admin">Admin</option>}
          </select>
          {adminExists && formData.role === 'admin' && (
            <p className="text-yellow-400 text-sm">Admin account already exists. You cannot sign up as admin.</p>
          )}

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">Sign up</button>
            <button type="button" className="px-4 py-2 rounded-md bg-white/6 text-white" onClick={() => setFormData({ name:'', email:'', password:'', role:'student' })}>Clear</button>
          </div>
        </form>
      </div>
    </div>
  )}
