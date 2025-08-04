'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'
import { motion } from 'framer-motion'

const generateProductID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PID'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function AddProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    purchase_price: '',
    selling_price: '',
    qty: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddProduct = async () => {
    const { name, purchase_price, selling_price, qty } = formData

    if (!name || !purchase_price || !selling_price || !qty) {
      setMessage('Please fill all fields.')
      return
    }

    const user = auth.currentUser
    if (!user) {
      setMessage('User not logged in.')
      return
    }

    setLoading(true)
    const pid = generateProductID()
    const userProductsRef = collection(db, 'users', user.uid, 'products')

    try {
      await addDoc(userProductsRef, {
        pid,
        name,
        purchase_price: parseFloat(purchase_price),
        selling_price: parseFloat(selling_price),
        qty: parseInt(qty),
        createdAt: new Date()
      })
      setMessage(`✅ Product "${name}" added successfully!`)
      setFormData({ name: '', purchase_price: '', selling_price: '', qty: '' })
    } catch (err) {
      console.error(err)
      setMessage('❌ Error adding product.')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-md max-w-xl w-full mx-auto mt-6"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800">➕ Add New Product</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="border px-3 py-2 rounded focus:outline-blue-400"
        />
        <input
          type="number"
          name="purchase_price"
          value={formData.purchase_price}
          onChange={handleChange}
          placeholder="Purchase Price"
          className="border px-3 py-2 rounded focus:outline-blue-400"
        />
        <input
          type="number"
          name="selling_price"
          value={formData.selling_price}
          onChange={handleChange}
          placeholder="Selling Price"
          className="border px-3 py-2 rounded focus:outline-blue-400"
        />
        <input
          type="number"
          name="qty"
          value={formData.qty}
          onChange={handleChange}
          placeholder="Initial Quantity"
          className="border px-3 py-2 rounded focus:outline-blue-400"
        />
      </div>

      <button
        onClick={handleAddProduct}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
      >
        {loading ? 'Adding...' : 'Add Product'}
      </button>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm font-medium text-blue-800 bg-blue-100 p-2 rounded"
        >
          {message}
        </motion.div>
      )}
    </motion.div>
  )
}
