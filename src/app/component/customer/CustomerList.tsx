'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { Trash2, Edit3, ChevronDown, ChevronUp, Users, Mail, Briefcase, MapPin, Calendar, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MyCustomerList() {
  const [customers, setCustomers] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const userCustomersRef = collection(db, 'users', user.uid, 'customers')
    const unsubscribe = onSnapshot(userCustomersRef, snapshot => {
      const customerList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCustomers(customerList)
    })
    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return
    const confirmDelete = window.confirm('Are you sure you want to delete this customer?')
    if (!confirmDelete) return
    await deleteDoc(doc(db, 'users', user.uid, 'customers', id))
  }

  return (
    <div className="space-y-4">
      {customers.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Customers Yet</h3>
          <p className="text-slate-500 text-center">Start adding customers to manage your relationships</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer, index) => {
            const isExpanded = expandedId === customer.id

            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div
                  className={`
                    bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 cursor-pointer
                    ${isExpanded 
                      ? 'border-purple-500/40 shadow-xl shadow-purple-500/10' 
                      : 'border-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5'
                    }
                  `}
                  onClick={() => handleToggleExpand(customer.id)}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{customer.customer_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-slate-400">{customer.customer_id}</p>
                          <span className="text-slate-600">•</span>
                          <p className="text-sm text-slate-400">{customer.business_type}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {customer.location}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-purple-500/10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                  <Hash className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Customer ID</p>
                                  <p className="text-sm font-semibold text-white">{customer.customer_id}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                                  <Mail className="w-4 h-4 text-pink-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                                  <p className="text-sm font-semibold text-white">{customer.email}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <Briefcase className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Business Type</p>
                                  <p className="text-sm font-semibold text-white">{customer.business_type}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                  <MapPin className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Location</p>
                                  <p className="text-sm font-semibold text-white">{customer.location}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-center flex-shrink-0">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">Created At</p>
                                  <p className="text-sm font-semibold text-white">
                                    {customer.createdAt?.toDate
                                      ? new Date(customer.createdAt.toDate()).toLocaleDateString()
                                      : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-6 pt-4 border-t border-purple-500/10">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={e => {
                                e.stopPropagation()
                                setEditingCustomer(customer)
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all duration-300 font-medium"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(customer.id)
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}