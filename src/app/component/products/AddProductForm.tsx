'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'

export default function AddProductForm() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const handleAddProduct = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    const userProductsRef = collection(db, 'users', user.uid, 'products')
    await addDoc(userProductsRef, {
      name,
      price: parseFloat(price),
      createdAt: new Date()
    })

    alert('Product added!')
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
