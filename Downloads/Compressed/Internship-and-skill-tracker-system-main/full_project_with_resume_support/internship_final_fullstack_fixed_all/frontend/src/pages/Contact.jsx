import React, { useState } from 'react'

export default function Contact(){
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      alert('Please fill name, email and message')
      return
    }
    setLoading(true)
    try {
      // Adjust backend URL if needed
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        let msg = 'Thanks — your message was sent.'
        if (data.preview) msg += '\n\nPreview URL: ' + data.preview
        alert(msg)
        setForm({ name: '', email: '', message: '' })
      } else {
        alert('Failed to send message: ' + (data.error || 'unknown'))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to send message: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-slate-200">
      <h1>Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold">Get in touch</h3>
          <p className="mt-2 text-slate-300">Phone: <strong>8708999192</strong></p>
          <p className="mt-1 text-slate-300">Email: <strong>tg1128255@gmail.com</strong></p>
          <p className="mt-4 text-slate-300">You can also send us a message using the form.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input name="name" value={form.name} onChange={onChange} placeholder="Your name" className="w-full px-3 py-2 rounded bg-slate-700/20 border border-slate-700 text-sm" />
          <input name="email" value={form.email} onChange={onChange} placeholder="Your email" className="w-full px-3 py-2 rounded bg-slate-700/20 border border-slate-700 text-sm" />
          <textarea name="message" value={form.message} onChange={onChange} placeholder="Message" rows={5} className="w-full px-3 py-2 rounded bg-slate-700/20 border border-slate-700 text-sm" />
          <div>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded">{loading ? 'Sending...' : 'Send message'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
