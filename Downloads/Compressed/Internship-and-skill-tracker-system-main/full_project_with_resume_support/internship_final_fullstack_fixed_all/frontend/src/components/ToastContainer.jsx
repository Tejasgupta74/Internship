import React, { useEffect, useState } from 'react'
import { registerToast } from '../utils/toast'

export default function ToastContainer(){
  const [toasts, setToasts] = useState([])
  useEffect(()=> registerToast( (t) => setToasts(s => [...s, t]) ), [])
  useEffect(()=> {
    if(toasts.length===0) return;
    const id = setTimeout(()=> setToasts(s => s.slice(1)), 3800);
    return ()=> clearTimeout(id);
  }, [toasts]);
  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded-lg shadow-card ${t.type==='error'?'bg-red-600':'bg-slate-800'} text-white`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
