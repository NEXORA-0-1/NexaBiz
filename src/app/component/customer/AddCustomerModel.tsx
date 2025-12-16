'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { X, User, Mail, Briefcase, MapPin, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [loading, setLoading] = useState(false)

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
    if (!user) {
      alert('User not logged in')
      return
    }

    if (!customerName || !businessType || !location || !email) {
      alert('All fields are required')
      return
    }

    try {
      setLoading(true)
      const userCustomersRef = collection(db, 'users', user.uid, 'customers')

      await addDoc(userCustomersRef, {
        customer_id: nextCustomerId,
        customer_name: customerName,
        business_type: businessType,
        location,
        email,
        createdAt: new Date()
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Failed to add customer')
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
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add Customer</h2>
                <p className="text-xs text-slate-500">Create a new customer entry</p>
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
            {/* Customer ID Display */}
            <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400">Customer ID:</span>
                <span className="text-sm font-bold text-purple-400">{nextCustomerId}</span>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <User className="w-4 h-4 text-purple-400" />
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Mail className="w-4 h-4 text-pink-400" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                required
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Business Type
              </label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all"
                required
              >
                <option value="" className="bg-slate-900">Select Business Type</option>
                <option value="OnlineDistributor" className="bg-slate-900">Online Distributor</option>
                <option value="RetailChain" className="bg-slate-900">Retail Chain</option>
                <option value="ExportAgent" className="bg-slate-900">Export Agent</option>
                <option value="Boutique" className="bg-slate-900">Boutique</option>
              </select>
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
              onClick={handleAddCustomer}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Customer'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}