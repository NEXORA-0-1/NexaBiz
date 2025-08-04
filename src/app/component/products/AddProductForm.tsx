'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'

// ✅ Function to generate PID like PID4F7G9A2X1Z
const generateProductID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PID'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AddProductForm() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const handleAddProduct = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    const pid = generateProductID()
    const userProductsRef = collection(db, 'users', user.uid, 'products')
    await addDoc(userProductsRef, {
      pid,
      name,
      price: parseFloat(price),
      createdAt: new Date()
    })

    alert(`Product added with ID: ${pid}`)
    setName('')
    setPrice('')
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Add Product</h2>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Product Name"
        className="border px-2 py-1 rounded w-full mb-2"
      />
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Price"
        className="border px-2 py-1 rounded w-full mb-2"
      />
      <button
        onClick={handleAddProduct}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Product
      </button>
    </div>
  )
}
