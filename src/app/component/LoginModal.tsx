'use client'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()

        if (userData.role === 'admin') {
          router.push('/adminDashboard')
        } else if (userData.approved === true) {
          router.push('/userDashboard')
        } else if (userData.role === 'supplier') {
          router.push('/supplierDashboard')
        } else {
          router.push('/waiting')
        }
      } else {
        alert('User data not found')
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-purple-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 p-8 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm">Login to access your dashboard</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              type="email"
              placeholder="your@email.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>

          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg text-white font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <a href="#" className="text-purple-400 hover:text-purple-300 font-semibold">
            Sign up
          </a>
        </div>
      </div>
    </div>
  )
}