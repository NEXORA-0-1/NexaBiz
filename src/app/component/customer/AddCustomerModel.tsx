'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function AddCustomerModal({ onClose, onSuccess }: Props) {
  const [customerName, setCustomerName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [email, setEmail] = useState('')
  const [nextCustomerId, setNextCustomerId] = useState('C001')

  // Generate next C001, C002 format
  useEffect(() => {
    const fetchNextId = async () => {
      const user = auth.currentUser
      if (!user) return

      const userCustomersRef = collection(db, 'users', user.uid, 'customers')
      const snapshot = await getDocs(userCustomersRef)

      const ids = snapshot.docs.map(doc => doc.data().customer_id)
      if (ids.length === 0) {
        setNextCustomerId('C0001')
        return
      }

      const numbers = ids.map((id: string) => parseInt(id.replace('C', '')))
      const max = Math.max(...numbers)
      const newId = `C${String(max + 1).padStart(4, '0')}`
      setNextCustomerId(newId)
    }

    fetchNextId()
  }, [])

  const handleAddCustomer = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    if (!customerName || !businessType || !location || !email) {
      return alert('All fields are required')
    }

    const userCustomersRef = collection(db, 'users', user.uid, 'customers')

    await addDoc(userCustomersRef, {
      customer_id: nextCustomerId,
      customer_name: customerName,
      business_type: businessType,
      location,
      email, // added email field
      createdAt: new Date()
    })

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Customer</h2>

        <p className="text-sm text-gray-500 mb-2">Customer ID: <strong>{nextCustomerId}</strong></p>

        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="Customer Name"
          className="border px-3 py-2 rounded w-full mb-3"
        />

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="border px-3 py-2 rounded w-full mb-3"
        />

        <select
          value={businessType}
          onChange={e => setBusinessType(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-3"
        >
          <option value="">Select Business Type</option>
          <option value="OnlineDistributor">Online Distributor</option>
          <option value="RetailChain">Retail Chain</option>
          <option value="ExportAgent">Export Agent</option>
          <option value="Boutique">Boutique</option>
        </select>

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
            onClick={handleAddCustomer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
