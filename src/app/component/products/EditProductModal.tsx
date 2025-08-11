'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

interface EditProductModalProps {
  product: any
  onClose: () => void
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
  const [form, setForm] = useState({
    name: '',
    purchase_price: 0,
    selling_price: 0,
    qty: 0,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        purchase_price: product.purchase_price || 0,
        selling_price: product.selling_price || 0,
        qty: product.qty || 0,
      })
    }
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user) return alert('User not logged in')

    const productRef = doc(db, 'users', user.uid, 'products', product.id)

    try {
      await updateDoc(productRef, {
        name: form.name,
        purchase_price: form.purchase_price,
        selling_price: form.selling_price,
        qty: form.qty,
      })
      alert('Product updated successfully!')
      onClose()
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update product.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          ✖
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product Name"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            name="purchase_price"
            value={form.purchase_price}
            onChange={handleChange}
            placeholder="Purchase Price"
            required
            className="w-full border p-2 rounded"
            min={0}
            step="0.01"
          />
          <input
            type="number"
            name="selling_price"
            value={form.selling_price}
            onChange={handleChange}
            placeholder="Selling Price"
            required
            className="w-full border p-2 rounded"
            min={0}
            step="0.01"
          />
          <input
            type="number"
            name="qty"
            value={form.qty}
            onChange={handleChange}
            placeholder="Quantity"
            required
            className="w-full border p-2 rounded"
            min={0}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
