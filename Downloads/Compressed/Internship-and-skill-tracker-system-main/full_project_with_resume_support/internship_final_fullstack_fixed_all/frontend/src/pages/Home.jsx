// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import { currentUser, fetchJobs } from '../api'
import PlacementsChart from '../components/PlacementsChart'
import JobCard from '../components/JobCard'
import studentsImg from '../assets/students.svg'
import companiesImg from '../assets/companies.svg'
import collegesImg from '../assets/colleges.svg'

export default function Home(){
  const user = currentUser()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    fetchJobs().then(data => {
      if (!mounted) return
      if (Array.isArray(data)) setJobs(data.slice(0,6))
      setLoading(false)
    }).catch(()=> setLoading(false))
    return ()=> mounted = false
  }, [])

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Internship & Skill Tracker —
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400"> modern placement workflows</span>
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Centralize job postings, applications and internship validations. Students
            submit resumes and apply quickly; companies and faculty manage selections
            and validations from a single dashboard.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="/jobs" className="btn btn-primary">Browse Open Jobs</a>
            { (!user || (user && user?.role === 'student')) && (
              <a href="/internships" className="btn btn-ghost">My Internships</a>
            )}
            <a href="/jobs/new" className="btn btn-ghost">Post a Job</a>
          </div>
          
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-slate-300 text-sm">Placement insights</div>
              <div className="text-2xl font-bold">Realtime stats</div>
            </div>
            <div className="text-sm muted">Updated now</div>
          </div>
          <PlacementsChart />
        </div>
      </section>

      {/* Who's using - three info cards */}
      <section>
        <h3 className="h2 mb-4">Who's using IT?</h3>
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg bg-white/2 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">Students and Professionals</h4>
                <p className="text-slate-300 text-sm">Unlock Your Potential: Compete, Build Resume, Grow and get Hired!</p>
              </div>
              <img src={studentsImg} alt="students" className="w-20 h-20 object-contain rounded-md" />
            </div>

            <div className="mt-4 border-t pt-4 text-slate-300">
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><span className="text-slate-400">📁</span> Access tailored jobs and internships</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">🏆</span> Participate in exciting competitions</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">↗️</span> Upskill with mentorships & workshops</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">👥</span> Showcase your profile to top recruiters</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg bg-white/2 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">Companies and Recruiters</h4>
                <p className="text-slate-300 text-sm">Discover Right Talent: Hire, Engage, and Brand Like Never Before!</p>
              </div>
              <img src={companiesImg} alt="companies" className="w-20 h-20 object-contain rounded-md" />
            </div>

            <div className="mt-4 border-t pt-4 text-slate-300">
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><span className="text-slate-400">🤝</span> Build employer brand with engagements</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">📣</span> Host jobs & internships to hire top talent</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">✨</span> Streamline hiring with AI-driven tools</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">🔗</span> Connect with 27M+ GenZs based on skills</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg bg-white/2 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">Colleges</h4>
                <p className="text-slate-300 text-sm">Bridge Academia and Industry: Empower Students with Real-World Opportunities!</p>
              </div>
              <img src={collegesImg} alt="colleges" className="w-20 h-20 object-contain rounded-md" />
            </div>

            <div className="mt-4 border-t pt-4 text-slate-300">
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><span className="text-slate-400">💼</span> Offer top competition & job opportunities</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">🤝</span> Partner with companies for placements</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">📊</span> Gain insights into student performance</li>
                <li className="flex items-start gap-3"><span className="text-slate-400">🏫</span> Foster industry-academic collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="h2">Latest Openings</h3>
            <div className="muted">Recently posted internships and jobs</div>
          </div>
          <a href="/jobs" className="text-slate-300 hover:text-white">View all jobs →</a>
        </div>

        {loading ? (
          <div className="card">Loading jobs...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs && jobs.length ? jobs.map(j => (
              <JobCard key={j._id || j.id} job={j} />
            )) : (
              <div className="card">No jobs available right now.</div>
            )}
          </div>
        )}
      </section>

      
    </div>
  )
}
