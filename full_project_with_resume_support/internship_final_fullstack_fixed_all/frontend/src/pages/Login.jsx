import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../api'

export default function Login(){
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showLoginOTP, setShowLoginOTP] = useState(false)
  const [loginOTP, setLoginOTP] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e){
    e.preventDefault()
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      console.log('Login response status:', res.status)
      const data = await res.json()
      console.log('Login response data:', data)
      
      if (data.error) return alert(data.error)
      
      // If OTP is required, show OTP modal
      if (data.requiresOTP) {
        setLoginEmail(formData.email)
        setShowLoginOTP(true)
        alert(data.message || 'OTP sent to your email')
        return
      }
      
      // Direct login (fallback for backward compatibility)
      if (data.token && data.user) {
        setAuth(data.token, data.user)
        nav('/')
      } else {
        alert('Login successful (no token returned).')
        nav('/')
      }
    } catch (err) {
      console.error('Login error', err)
      alert('Login failed — check console')
    }
  }

  async function handleVerifyLoginOTP(e) {
    e.preventDefault()
    
    if (!loginOTP) {
      alert('Please enter the OTP')
      return
    }

    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: loginOTP })
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      if (data.token && data.user) {
        setAuth(data.token, data.user)
        setShowLoginOTP(false)
        setLoginOTP('')
        nav('/')
      }
    } catch (err) {
      console.error('Verify login OTP error', err)
      alert('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendLoginOTP() {
    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: formData.password })
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
        return
      }
      
      alert('New OTP sent to your email')
    } catch (err) {
      console.error('Resend OTP error', err)
      alert('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!resetEmail) {
      alert('Please enter your email address')
      return
    }
    
    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      })
      const data = await res.json()
      alert(data.message || 'OTP sent to your email')
      setOtpSent(true)
    } catch (err) {
      console.error('Send OTP error', err)
      alert('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    
    if (!otp || !newPassword || !confirmPassword) {
      alert('Please fill all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
      const res = await fetch(base + '/api/auth/verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp, password: newPassword })
      })
      const data = await res.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      alert('Password reset successful! You can now login with your new password.')
      setShowForgotPassword(false)
      setResetEmail('')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setOtpSent(false)
    } catch (err) {
      console.error('Reset password error', err)
      alert('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  function closeModal() {
    setShowForgotPassword(false)
    setResetEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setOtpSent(false)
  }

  function closeLoginOTPModal() {
    setShowLoginOTP(false)
    setLoginOTP('')
    setLoginEmail('')
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="p-6 rounded-xl bg-white/4">
        <h2 className="text-xl font-bold text-white">Login</h2>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            name="email"
            className="w-full p-3 rounded-md bg-slate-800 text-white"
            placeholder="email" value={formData.email} onChange={handleChange} required />
          <input
            name="password"
            type="password"
            className="w-full p-3 rounded-md bg-slate-800 text-white"
            placeholder="password" value={formData.password} onChange={handleChange} required />
          
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Login
            </button>
            <button 
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-indigo-400 text-sm hover:text-indigo-300"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {/* Login OTP Verification Modal */}
      {showLoginOTP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Verify Login OTP</h3>
            <p className="text-gray-300 text-sm mb-4">
              Enter the OTP sent to your email to complete login.
            </p>
            
            <form onSubmit={handleVerifyLoginOTP}>
              <input
                type="text"
                className="w-full p-3 rounded-md bg-slate-700 text-white mb-4"
                placeholder="Enter OTP"
                value={loginOTP}
                onChange={(e) => setLoginOTP(e.target.value)}
                maxLength={6}
                required
              />
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={closeLoginOTPModal}
                  className="flex-1 px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleResendLoginOTP}
                disabled={loading}
                className="w-full text-indigo-400 text-sm hover:text-indigo-300 mt-3 disabled:opacity-50"
              >
                Resend OTP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal with OTP */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
            
            {!otpSent ? (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  Enter your email address and we'll send you an OTP to reset your password.
                </p>
                
                <form onSubmit={handleSendOTP}>
                  <input
                    type="email"
                    className="w-full p-3 rounded-md bg-slate-700 text-white mb-4"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  Enter the OTP sent to your email and your new password.
                </p>
                
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <input
                    type="text"
                    className="w-full p-3 rounded-md bg-slate-700 text-white"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                  
                  <input
                    type="password"
                    className="w-full p-3 rounded-md bg-slate-700 text-white"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  
                  <input
                    type="password"
                    className="w-full p-3 rounded-md bg-slate-700 text-white"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-indigo-400 text-sm hover:text-indigo-300 mt-2"
                  >
                    Resend OTP
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}