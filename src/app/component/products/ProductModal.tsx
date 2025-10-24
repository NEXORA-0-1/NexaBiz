'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot } from 'firebase/firestore'
import { useState, useEffect } from 'react'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

const generateProductID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PID'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const CATEGORY_OPTIONS = [
  'T-Shirt',
  'Jeans',
  'Formal Shirt',
  'Dress/Blouse',
  'Jacket/Hoodie'
]

export default function ProductModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [materialID, setMaterialID] = useState('')
  const [materialPerUnit, setMaterialPerUnit] = useState('')
  const [baseCost, setBaseCost] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [stockAmount, setStockAmount] = useState('')
  const [materials, setMaterials] = useState<any[]>([])

  // ✅ Fetch materials from Firestore
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userMaterialsRef = collection(db, 'users', user.uid, 'materials')

    const unsubscribe = onSnapshot(userMaterialsRef, snapshot => {
      const matList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMaterials(matList)
    })

    return () => unsubscribe()
  }, [])

  // ✅ Add product with selected material_id
  const handleAddProduct = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')
    if (!materialID) return alert('Please select a material')

    const pid = generateProductID()
    const userProductsRef = collection(db, 'users', user.uid, 'products')

    await addDoc(userProductsRef, {
      product_id: pid,
      product_name: name,
      category,
      material_id: materialID, // ✅ store material ID only
      material_per_unit_kg: parseFloat(materialPerUnit),
      base_cost_usd: parseFloat(baseCost),
      suggested_price_usd: parseFloat(suggestedPrice),
      stock_amount: parseInt(stockAmount),
      createdAt: new Date()
    })

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Product</h2>

        {/* Product name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Product Name"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        {/* Category */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-3"
          required
        >
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* ✅ Material dropdown from Firestore */}
        <select
          value={materialID}
          onChange={e => setMaterialID(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-3"
          required
        >
          <option value="">Select Material</option>
          {materials.map(m => (
            <option key={m.id} value={m.material_id}>
              {m.material_id} — {m.material_name}
            </option>
          ))}
        </select>

        {/* Material per unit */}
        <input
          type="number"
          value={materialPerUnit}
          onChange={e => setMaterialPerUnit(e.target.value)}
          placeholder="Material per Unit (kg)"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        {/* Base cost */}
        <input
          type="number"
          value={baseCost}
          onChange={e => setBaseCost(e.target.value)}
          placeholder="Base Cost (USD)"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        {/* Suggested price */}
        <input
          type="number"
          value={suggestedPrice}
          onChange={e => setSuggestedPrice(e.target.value)}
          placeholder="Suggested Price (USD)"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        {/* Stock amount */}
        <input
          type="number"
          value={stockAmount}
          onChange={e => setStockAmount(e.target.value)}
          placeholder="Stock Amount"
          className="border px-3 py-2 rounded w-full mb-3"
          required
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
