'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { X, Truck, Tag, Mail, Phone, MapPin, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [loading, setLoading] = useState(false)
  
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
    if (!user) {
      alert('User not logged in')
      return
    }

    if (!supplierName || !category || !email || !phone || !location) {
      alert('All fields are required')
      return
    }

    try {
      setLoading(true)
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
    } catch (error) {
      console.error('Error adding supplier:', error)
      alert('Failed to add supplier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-md"
        >
          {/* Header */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add Supplier</h2>
                <p className="text-xs text-slate-500">Create a new supplier entry</p>
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
            {/* Supplier ID Display */}
            <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400">Supplier ID:</span>
                <span className="text-sm font-bold text-purple-400">{nextSupplierId}</span>
              </div>
            </div>

            {/* Supplier Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Truck className="w-4 h-4 text-purple-400" />
                Supplier Name
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Enter supplier name"
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
                <option value="Food" className="bg-slate-900">Food</option>
                <option value="Clothing" className="bg-slate-900">Clothing</option>
                <option value="Electronics" className="bg-slate-900">Electronics</option>
                <option value="Furniture" className="bg-slate-900">Furniture</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="supplier@example.com"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Phone className="w-4 h-4 text-green-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-purple-500/20 p-6 flex justify-end gap-3 rounded-b-2xl">
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
              onClick={handleAddSupplier}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Supplier'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}