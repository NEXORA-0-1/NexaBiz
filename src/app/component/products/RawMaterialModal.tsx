'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useState } from 'react'
import { X, Layers, Tag, Weight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

const generateMaterialID = () => {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `M${num}`
}

export default function RawMaterialModal({ onClose, onSuccess }: Props) {
  const [mName, setMName] = useState('')
  const [qty, setQty] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddMaterial = async () => {
    const user = auth.currentUser
    if (!user) {
      alert('User not logged in')
      return
    }

    try {
      setLoading(true)
      const mID = generateMaterialID()
      const userMaterialsRef = collection(db, 'users', user.uid, 'materials')

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
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-pink-500/20 rounded-2xl shadow-2xl shadow-pink-500/10 w-full max-w-md"
        >
          {/* Header */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-b border-pink-500/20 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add Raw Material</h2>
                <p className="text-xs text-slate-500">Create a new material entry</p>
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
            {/* Material Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Tag className="w-4 h-4 text-pink-400" />
                Material Name
              </label>
              <input
                type="text"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder="e.g. Cotton, Polyester, Denim"
                className="w-full bg-slate-900/50 border border-pink-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/40 transition-all"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Weight className="w-4 h-4 text-green-400" />
                Quantity (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-pink-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/40 transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-2">Enter the available quantity in kilograms</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-pink-500/20 p-6 flex justify-end gap-3 rounded-b-2xl">
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
              onClick={handleAddMaterial}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:shadow-xl hover:shadow-pink-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Material'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}