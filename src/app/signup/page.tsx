'use client'
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const generateUserId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'UID'
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSignup = async () => {
    try {
      setLoading(true)

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Generate custom user ID
      const generatedUserId = generateUserId()

      // 3. Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        userId: generatedUserId,
        role: 'user',         // default role
        approved: false,      // waiting for admin approval
        createdAt: new Date()
      })

      alert(`Signup successful! Your User ID is ${generatedUserId}. Please wait for admin approval.`)
      router.push('/login') // Redirect to login page
    } catch (error: any) {
      console.error('Signup error:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded shadow">
      <h1 className="text-xl mb-4 font-bold">Sign Up</h1>
      <input
        className="border p-2 w-full mb-2"
        type="text"
        placeholder="Full Name"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
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
        className="bg-green-600 text-white p-2 w-full rounded"
        onClick={handleSignup}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>
    </div>
  )
}
