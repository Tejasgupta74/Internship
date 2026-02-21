import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { currentUser, logout } from '../api'

export default function Header(){
  const [user, setUser] = useState(null)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    setUser(currentUser())
  }, [])

  useEffect(()=> {
    const refreshUser = () => setUser(currentUser())
    window.addEventListener('auth', refreshUser)
    window.addEventListener('storage', refreshUser)
    return () => {
      window.removeEventListener('auth', refreshUser)
      window.removeEventListener('storage', refreshUser)
    }
  }, [])

  useEffect(()=> { document.documentElement.classList.toggle('dark', dark) }, [dark])

  return (
    <header className="bg-white/3 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-nowrap">
        
        {/* Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 
                          flex items-center justify-center shadow-lg text-white font-bold">
            IT
          </div>
          <div>
            <div className="text-white font-bold text-lg">
              Internship & Skill Tracker System
            </div>
            <div className="text-slate-300 text-sm">Placement dashboard</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">

          <nav className="flex gap-2 items-center whitespace-nowrap">

            <Link to="/" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
              Home
            </Link>

            <Link to="/jobs" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
              Jobs
            </Link>

            {/* Hide My Internships when logged in as faculty, company or admin */}
            {user && user?.role !== 'faculty' && user?.role !== 'company' && user?.role !== 'admin' && (
              <Link to="/internships" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
                My Internships
              </Link>
            )}

            {/* Faculty visible ONLY for faculty + admin */}
            {(user?.role === 'faculty' || user?.role === 'admin') && (
              <Link to="/faculty" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
                Faculty
              </Link>
            )}

            {/* Admin: user management */}
            {user?.role === 'admin' && (
              <Link to="/admin/users" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">Users</Link>
            )}

            {/* Student only */}
            {user?.role === 'student' && (
              <Link to="/my-applications" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
                My Applications
              </Link>
            )}

            {/* Company + Admin */}
            {(user?.role === 'company' || user?.role === 'admin') && (
              <Link to="/applications" className="text-slate-200 hover:text-white px-3 py-2 rounded-md">
                Applications
              </Link>
            )}

          </nav>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2 whitespace-nowrap">

            {user ? (
              <>
                {user.role === "company" && (
                  <Link 
                    to="/jobs/new" 
                    className="px-3 py-1 rounded-md bg-green-500 text-white"
                  >
                    + Add Job
                  </Link>
                )}

                <div className="text-sm text-slate-200 hidden sm:block">
                  {user.name}
                </div>

                <div className="px-3 py-1 rounded-full bg-slate-800 text-xs text-sky-200">
                  {user.role}
                </div>

                <button 
                  onClick={()=>{ logout(); window.location.reload() }} 
                  className="px-3 py-1 rounded-md bg-sky-500 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1 rounded-md bg-indigo-600 text-white">
                  Login
                </Link>

                <Link to="/signup" className="px-3 py-1 rounded-md bg-green-600 text-white">
                  Signup
                </Link>
              </>
            )}

          </div>

        </div>
      </div>
    </header>
  )
}
