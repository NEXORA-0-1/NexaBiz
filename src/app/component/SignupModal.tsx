'use client'
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { X, User, Mail, Lock, Sparkles } from 'lucide-react'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedUserId, setGeneratedUserId] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const generateUserId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'UID'
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Generate custom user ID
      const userId = generateUserId()

      // 3. Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        userId: userId,
        role: 'user',
        approved: false,
        createdAt: new Date()
      })

      setGeneratedUserId(userId)
      setShowSuccess(true)
    } catch (error: any) {
      console.error('Signup error:', error)
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered. Please login instead.')
      } else if (error.code === 'auth/weak-password') {
        alert('Password should be at least 6 characters long.')
      } else {
        alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setEmail('')
    setPassword('')
    setShowSuccess(false)
    setGeneratedUserId('')
    onClose()
  }

  const handleSuccessClose = () => {
    handleClose()
    if (onSwitchToLogin) {
      onSwitchToLogin()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-purple-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 p-8 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X size={20} />
        </button>

        {!showSuccess ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-semibold mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Join NexaBiz Today</span>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Get Started
              </h2>
              <p className="text-slate-400 text-sm">Create your account and transform your business</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                    type="text"
                    placeholder="John Doe"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                    type="email"
                    placeholder="your@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                    type="password"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
              </div>

              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg text-white font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button 
                onClick={() => {
                  handleClose()
                  if (onSwitchToLogin) onSwitchToLogin()
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Login
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success Screen */}
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3">
                Account Created!
              </h2>
              
              <p className="text-slate-300 text-sm mb-6">
                Your account has been successfully created.
              </p>

              <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4 mb-6">
                <p className="text-slate-400 text-xs mb-2">Your User ID</p>
                <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider">
                  {generatedUserId}
                </div>
                <p className="text-slate-500 text-xs mt-2">Save this ID for your records</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  ⏳ Your account is pending admin approval. You'll receive access once approved.
                </p>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg text-white font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Continue to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}