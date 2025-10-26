'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function AddSupplierModal({ onClose, onSuccess }: Props) {
  const [supplierName, setSupplierName] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [nextSupplierId, setNextSupplierId] = useState('S0001')

  
  useEffect(() => {
    const fetchNextId = async () => {
      const user = auth.currentUser
      if (!user) return

      const userSuppliersRef = collection(db, 'users', user.uid, 'suppliers')
      const snapshot = await getDocs(userSuppliersRef)

      const ids = snapshot.docs.map(doc => doc.data().supplier_id)
      if (ids.length === 0) {
        setNextSupplierId('S0001')
        return
      }

      const numbers = ids.map((id: string) => parseInt(id.replace('S', '')))
      const max = Math.max(...numbers)
      const newId = `S${String(max + 1).padStart(4, '0')}`
      setNextSupplierId(newId)
    }

    fetchNextId()
  }, [])


  const handleAddSupplier = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    // Basic validation
    if (!supplierName || !category || !email || !phone || !location) {
      return alert('All fields are required')
    }

    const userSuppliersRef = collection(db, 'users', user.uid, 'suppliers')

    await addDoc(userSuppliersRef, {
      supplier_id: nextSupplierId,
      supplier_name: supplierName,
      category,
      email,
      phone,
      location,
      createdAt: new Date()
    })

    onSuccess()
    onClose()
  }


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Supplier</h2>

        <p className="text-sm text-gray-500 mb-2">
          Supplier ID: <strong>{nextSupplierId}</strong>
        </p>

        <input
          type="text"
          value={supplierName}
          onChange={e => setSupplierName(e.target.value)}
          placeholder="Supplier Name"
          className="border px-3 py-2 rounded w-full mb-3"
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-3"
        >
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Clothing">Clothing</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
        </select>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="border px-3 py-2 rounded w-full mb-3"
        />

        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="border px-3 py-2 rounded w-full mb-3"
        />

        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location"
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
            onClick={handleAddSupplier}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
