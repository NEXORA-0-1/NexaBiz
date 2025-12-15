'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { X, Package, Tag, Layers, Weight, DollarSign, TrendingUp, Box } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [loading, setLoading] = useState(false)

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

  const handleAddProduct = async () => {
    const user = auth.currentUser
    if (!user) {
      alert('User not logged in')
      return
    }
    if (!materialID) {
      alert('Please select a material')
      return
    }

    try {
      setLoading(true)
      const pid = generateProductID()
      const userProductsRef = collection(db, 'users', user.uid, 'products')

      await addDoc(userProductsRef, {
        product_id: pid,
        product_name: name,
        category,
        material_id: materialID,
        material_per_unit_kg: parseFloat(materialPerUnit),
        base_cost_usd: parseFloat(baseCost),
        suggested_price_usd: parseFloat(suggestedPrice),
        stock_amount: parseInt(stockAmount),
        createdAt: new Date()
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add New Product</h2>
                <p className="text-xs text-slate-500">Create a new product entry</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Package className="w-4 h-4 text-purple-400" />
                Product Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter product name"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Tag className="w-4 h-4 text-pink-400" />
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all"
                required
              >
                <option value="" className="bg-slate-900">Select Category</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Material
              </label>
              <select
                value={materialID}
                onChange={e => setMaterialID(e.target.value)}
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all"
                required
              >
                <option value="" className="bg-slate-900">Select Material</option>
                {materials.map(m => (
                  <option key={m.id} value={m.material_id} className="bg-slate-900">
                    {m.material_id} — {m.material_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Layout for Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Material per Unit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Weight className="w-4 h-4 text-green-400" />
                  Material per Unit (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={materialPerUnit}
                  onChange={e => setMaterialPerUnit(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                  required
                />
              </div>

              {/* Stock Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Box className="w-4 h-4 text-purple-400" />
                  Stock Amount
                </label>
                <input
                  type="number"
                  value={stockAmount}
                  onChange={e => setStockAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                  required
                />
              </div>

              {/* Base Cost */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  Base Cost (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={baseCost}
                  onChange={e => setBaseCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                  required
                />
              </div>

              {/* Suggested Price */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Suggested Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={suggestedPrice}
                  onChange={e => setSuggestedPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-purple-500/20 p-6 flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl font-semibold transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddProduct}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}