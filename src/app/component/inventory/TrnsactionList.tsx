'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { Trash2, ChevronDown, ChevronUp, ShoppingCart, Calendar, Receipt, Package, AlertCircle, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type TransactionItem = {
  pid: string
  product_name: string
  selling_price: number
  qty: number
  discount?: number
  subtotal: number
  discounted_subtotal?: number
}

type Transaction = {
  id: string
  tid: string
  cus_name: string
  total_amount: number
  createdAt: any
  items: TransactionItem[]
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userTransactionsRef = collection(db, 'users', user.uid, 'transactions')
    const q = query(userTransactionsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, snapshot => {
      const txList: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[]
      setTransactions(txList)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirm = window.confirm('Are you sure you want to delete this transaction?')
    if (!confirm) return

    setDeleteLoading(id)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
          <p className="text-slate-500 text-center">Your transaction history will appear here</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => {
            const isExpanded = expandedId === tx.id
            const itemCount = tx.items.length

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div
                  className={`
                    bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                    ${isExpanded 
                      ? 'border-purple-500/40 shadow-xl shadow-purple-500/10' 
                      : 'border-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5'
                    }
                  `}
                  onClick={() => handleToggleExpand(tx.id)}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white truncate">{tx.cus_name}</h3>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex-shrink-0">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="font-mono">{tx.tid}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {tx.createdAt?.toDate
                                ? new Date(tx.createdAt.toDate()).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          ${tx.total_amount?.toFixed(2)}
                        </p>
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
                          <div className="pt-4">
                            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                              <Package className="w-4 h-4 text-purple-400" />
                              Purchased Items
                            </h4>
                            
                            <div className="overflow-x-auto rounded-lg border border-purple-500/10">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-slate-900/50">
                                    <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Product
                                    </th>
                                    <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Price
                                    </th>
                                    <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Qty
                                    </th>
                                    <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Discount
                                    </th>
                                    <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Subtotal
                                    </th>
                                    <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                      Final
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-slate-900/30">
                                  {tx.items.map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t border-purple-500/10 hover:bg-slate-800/50 transition-colors"
                                    >
                                      <td className="p-3 text-white font-medium">
                                        {item.product_name}
                                      </td>
                                      <td className="p-3 text-right text-slate-300">
                                        ${item.selling_price.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right text-slate-300">
                                        <span className="inline-block px-2 py-1 bg-slate-700/50 rounded text-xs font-semibold">
                                          {item.qty}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        {item.discount ? (
                                          <span className="inline-block px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-xs font-semibold">
                                            {item.discount}%
                                          </span>
                                        ) : (
                                          <span className="text-slate-500">—</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right text-slate-300">
                                        ${item.subtotal.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right font-semibold text-white">
                                        ${(item.discounted_subtotal ?? item.subtotal).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-end mt-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleDelete(tx.id)
                                }}
                                disabled={deleteLoading === tx.id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deleteLoading === tx.id ? 'Deleting...' : 'Delete'}
                              </motion.button>
                            </div>
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