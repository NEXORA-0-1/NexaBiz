'use client'

import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  userId: string
  email: string
  role?: string
  approved: boolean
}

export default function UserDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
        setLoading(false)
      } else {
        router.push('/login') // Redirect if not logged in
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) return <div className="p-4">Loading...</div>

  if (!userData?.approved) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Waiting for Approval</h1>
        <p>Your account is pending admin approval.</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <div className="mb-4">
        <p><strong>User ID:</strong> {userData.userId}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role || 'user'}</p>
        <p><strong>Approved:</strong> {userData.approved ? 'Yes' : 'No'}</p>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
}
