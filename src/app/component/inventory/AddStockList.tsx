'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { Trash2, ChevronDown, ChevronUp, Package, TrendingUp, Calendar, Box } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type StockItem = {
  pid: string
  product_name: string
  suggested_price_usd: number
  qty: number
  subtotal: number
}

type Stock = {
  id: string
  supplierName: string
  total: number
  createdAt: any
  items: StockItem[]
}

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const stockRef = collection(db, 'users', user.uid, 'addstock')

    const unsubscribe = onSnapshot(stockRef, snapshot => {
      const stockList: Stock[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Stock[]
      setStocks(stockList)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirm = window.confirm('Are you sure you want to delete this stock record?')
    if (!confirm) return

    setDeleteLoading(id)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addstock', id))
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {stocks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
            <Box className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Stock Records Yet</h3>
          <p className="text-slate-500 text-center">Your stock history will appear here</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {stocks
            .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
            .map((stock, index) => {
              const isExpanded = expandedId === stock.id
              const itemCount = stock.items.length

              return (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div
                    className={`
                      bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                      ${isExpanded 
                        ? 'border-pink-500/40 shadow-xl shadow-pink-500/10' 
                        : 'border-purple-500/10 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5'
                      }
                    `}
                    onClick={() => handleToggleExpand(stock.id)}
                  >
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-pink-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">{stock.supplierName}</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex-shrink-0">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {stock.createdAt?.toDate
                                  ? new Date(stock.createdAt.toDate()).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            ${stock.total?.toFixed(2)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-pink-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" />
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
                                <Package className="w-4 h-4 text-pink-400" />
                                Stocked Items
                              </h4>
                              
                              <div className="space-y-2 mb-4">
                                {stock.items.map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex justify-between items-center p-3 bg-slate-900/50 backdrop-blur-sm border border-purple-500/10 rounded-lg hover:border-pink-500/30 transition-all"
                                  >
                                    <span className="text-white font-medium">{item.product_name}</span>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span className="text-slate-400">
                                        {item.qty} × ${item.suggested_price_usd?.toFixed(2) || '0.00'}
                                      </span>
                                      <span className="font-bold text-pink-400">
                                        ${item.subtotal?.toFixed(2) || '0.00'}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              <div className="flex justify-end">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleDelete(stock.id)
                                  }}
                                  disabled={deleteLoading === stock.id}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {deleteLoading === stock.id ? 'Deleting...' : 'Delete'}
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