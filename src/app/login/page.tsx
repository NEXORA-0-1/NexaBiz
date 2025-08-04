'use client'
import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 🔍 Get role and approval status
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()

        if (userData.role === 'admin') {
          router.push('/admin')
        } else if (userData.approved === true) {
          router.push('/dashboard')
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

  return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded shadow">
      <h1 className="text-xl mb-4 font-bold">Login</h1>
      <input
        className="border p-2 w-full mb-2"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        className="border p-2 w-full mb-4"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button
        className="bg-blue-600 text-white p-2 w-full rounded"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}
