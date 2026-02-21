import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer(){
  return (
    <footer className="mt-10 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-3xl font-bold text-white mb-2">IT</div>
          <div className="text-sm muted mb-4">Simply #1 Internship and Tracking Website</div>

          <div className="text-sm mb-2">Stay Connected</div>
          <div className="text-sm text-slate-400">tg1128255@gmail.com</div>
          <div className="text-sm text-slate-400">8708999192</div>

          <div className="flex gap-3 mt-3">
            <button className="w-8 h-8 rounded bg-slate-700/30 flex items-center justify-center">f</button>
            <button className="w-8 h-8 rounded bg-slate-700/30 flex items-center justify-center">t</button>
            <button className="w-8 h-8 rounded bg-slate-700/30 flex items-center justify-center">in</button>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-base">Quick Links</h4>
          <ul className="text-sm text-slate-400 space-y-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-base">Contact Us</h4>
          <ul className="text-sm text-slate-400 space-y-3">
            <li className="flex items-center gap-2">📞 <span>8708999192</span></li>
            <li className="flex items-center gap-2">✉️ <span>tg1128255@gmail.com</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-sm text-slate-500">
          <div>© {new Date().getFullYear()} it — All rights reserved</div>
        </div>
      </div>
    </footer>
  )
}
