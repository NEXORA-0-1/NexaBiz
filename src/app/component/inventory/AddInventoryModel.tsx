// components/AddInventoryModal.tsx
'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

const generateInventoryID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'IID'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AddInventoryModal({ onClose, onSuccess }: Props) {
  const [cus_name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  const handleAddInventory = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    const iid = generateInventoryID()
    const userInventoryRef = collection(db, 'users', user.uid, 'inventory')

    await addDoc(userInventoryRef, {
      iid,
      cus_name,
      purchase_price: parseFloat(purchasePrice),
      selling_price: 0,
      qty: 0,
      createdAt: new Date()
    })

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add inventory</h2>
        <input
          type="text"
          value={cus_name}
          onChange={e => setName(e.target.value)}
          placeholder="Product Name"
          className="border px-3 py-2 rounded w-full mb-3"
        />
        <input
          type="number"
          value={purchasePrice}
          onChange={e => setPurchasePrice(e.target.value)}
          placeholder="Purchase Price"
          className="border px-3 py-2 rounded w-full mb-3"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAddInventory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
