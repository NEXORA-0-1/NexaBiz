'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

// Generate material ID (M + 4 digits)
const generateMaterialID = () => {
  const num = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
  return `M${num}`
}

export default function RawMaterialModal({ onClose, onSuccess }: Props) {
  const [mName, setMName] = useState('')
  const [qty, setQty] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddMaterial = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    const mID = generateMaterialID()
    const userMaterialsRef = collection(db, 'users', user.uid, 'materials')

    try {
      setLoading(true)

      await addDoc(userMaterialsRef, {
        material_id: mID,
        material_name: mName,
        qty_kg: parseFloat(qty),
        createdAt: new Date()
      })

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error adding material:', err)
      alert('Failed to add material.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Raw Material</h2>

        <input
          type="text"
          value={mName}
          onChange={(e) => setMName(e.target.value)}
          placeholder="Material Name (e.g. Cotton)"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Quantity (kg)"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMaterial}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
