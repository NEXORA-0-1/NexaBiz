'use client'

import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'))
    const userList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setUsers(userList)
  }

  const approveUser = async (userId: string) => {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { approved: true })
    alert('User approved successfully!')
    fetchUsers()
  }

  const disableUser = async (userId: string) => {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { approved: false })
    alert('User disabled successfully!')
    fetchUsers()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Approved</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">{user.approved ? 'Yes' : 'No'}</td>
              <td className="p-2 border">
                {!user.approved ? (
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => approveUser(user.id)}
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => disableUser(user.id)}
                  >
                    Disable
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
