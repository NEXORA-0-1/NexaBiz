'use client'

import { auth, db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  runTransaction
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { X, ShoppingCart, User, Calendar, Plus, Trash2, Package, DollarSign, Percent } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

const generateTransactionID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TID'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

type Product = {
  id: string
  pid: string
  name: string
  selling_price: number
  qty: number
}

type ItemRow = {
  productId: string
  pid: string
  product_name: string
  selling_price: number
  qty: number
  discount?: number
}

export default function AddTransactionModal({ onClose, onSuccess }: Props) {
  const [cus_name, setCusName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [customers, setCustomers] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [createdAt, setCreatedAt] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      const user = auth.currentUser
      if (!user) return

      const snap = await getDocs(collection(db, 'users', user.uid, 'products'))
      const productList: Product[] = snap.docs.map(d => ({
        id: d.id,
        pid: d.data().product_id || "",
        name: d.data().product_name || "",
        selling_price: Number(d.data().suggested_price_usd || 0),
        qty: Number(d.data().stock_amount || 0),
      }))
      setProducts(productList)
    }
    fetchProducts()

    const fetchCustomers = async () => {
      const user = auth.currentUser
      if (!user) return
      const snap = await getDocs(collection(db, 'users', user.uid, 'customers'))
      setCustomers(snap.docs.map(d => d.data().customer_name))
    }
    fetchCustomers()
  }, [])

  const handleAddRow = () => {
    setItems(prev => [
      ...prev,
      { productId: '', pid: '', product_name: '', selling_price: 0, qty: 1, discount: 0 }
    ])
  }

  const handleRemoveRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updated = [...items]
    updated[index] = {
      productId: product.id,
      pid: product.pid,
      product_name: product.name,
      selling_price: product.selling_price,
      qty: updated[index]?.qty || 1,
      discount: updated[index]?.discount || 0
    }
    setItems(updated)
  }

  const handleQtyChange = (index: number, qtyStr: string) => {
    const qty = Math.max(1, Number(qtyStr || 0))
    const updated = [...items]
    updated[index].qty = qty
    setItems(updated)
  }

  const handleDiscountChange = (index: number, discountStr: string) => {
    let discount = Math.max(0, Math.min(100, Number(discountStr || 0)))
    const updated = [...items]
    updated[index].discount = discount
    setItems(updated)
  }

  const discountedSubtotal = (item: ItemRow) => {
    const discountRate = item.discount || 0
    return item.qty * item.selling_price * (1 - discountRate / 100)
  }

  const totalAmount = items.reduce((sum, i) => sum + discountedSubtotal(i), 0)

  const handleSaveTransaction = async () => {
    const user = auth.currentUser
    if (!user) return window.alert('User not logged in')
    if (!cus_name.trim()) return window.alert('Please enter customer name')
    if (items.length === 0) return window.alert('Add at least one product')
    if (items.some(i => !i.productId)) return window.alert('Please select a product on all rows')

    const mergedMap = new Map<string, ItemRow>()
    for (const i of items) {
      const key = i.productId
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...i })
      } else {
        const prev = mergedMap.get(key)!
        mergedMap.set(key, {
          ...prev,
          qty: prev.qty + i.qty
        })
      }
    }
    const mergedItems = Array.from(mergedMap.values())
    const mergedTotal = mergedItems.reduce((s, i) => s + discountedSubtotal(i), 0)

    const tid = generateTransactionID()
    const userTransactionsRef = collection(db, 'users', user.uid, 'transactions')

    try {
      setLoading(true)
      await runTransaction(db, async (tx) => {
        const productRefs = mergedItems.map(item =>
          doc(db, 'users', user.uid, 'products', item.productId)
        )

        const productSnaps = await Promise.all(productRefs.map(ref => tx.get(ref)))

        productSnaps.forEach((snap, idx) => {
          if (!snap.exists()) throw new Error(`Product not found: ${mergedItems[idx].product_name}`)
          const currentQty = Number(snap.data()?.stock_amount || 0)
          if (mergedItems[idx].qty > currentQty) {
            throw new Error(
              `Not enough stock for ${mergedItems[idx].product_name}. Available: ${currentQty}, Requested: ${mergedItems[idx].qty}`
            )
          }
        })

        productSnaps.forEach((snap, idx) => {
          const ref = productRefs[idx]
          const currentQty = Number(snap.data()?.stock_amount || 0)
          tx.update(ref, { stock_amount: currentQty - mergedItems[idx].qty })
        })

        const newTxRef = doc(userTransactionsRef)
        tx.set(newTxRef, {
          tid,
          cus_name,
          items: mergedItems.map(i => ({
            pid: i.pid,
            product_name: i.product_name,
            selling_price: i.selling_price,
            qty: i.qty,
            discount: i.discount || 0,
            subtotal: i.qty * i.selling_price,
            discounted_subtotal: discountedSubtotal(i)
          })),
          total_amount: mergedTotal,
          createdAt: createdAt ? new Date(createdAt) : new Date() 
        })
      })

      window.alert('✅ Transaction saved & stock updated!')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      window.alert(`❌ Error: ${err.message}`)
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
          className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-4xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add Transaction</h2>
                <p className="text-xs text-slate-500">Create a new sales transaction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form */}
          <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 180px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Customer & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Customer Name
                </label>
                <input
                  type="text"
                  value={cus_name}
                  onChange={e => {
                    setCusName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter customer name"
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-all"
                />
                
                {showSuggestions && cus_name.trim() !== '' && (
                  <ul className="absolute z-10 bg-slate-900 border border-purple-500/20 w-full rounded-xl shadow-xl mt-2 max-h-40 overflow-y-auto">
                    {customers
                      .filter(name => name.toLowerCase().includes(cus_name.toLowerCase()))
                      .slice(0, 10)
                      .map((name, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setCusName(name)
                            setShowSuggestions(false)
                          }}
                          className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-white transition-colors"
                        >
                          {name}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={createdAt}
                  onChange={e => setCreatedAt(e.target.value)}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Package className="w-4 h-4 text-pink-400" />
                  Products
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddRow}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-all font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </motion.button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-purple-500/20">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount %</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Subtotal</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/30">
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-purple-500/10">
                        <td className="p-3">
                          <select
                            value={item.productId}
                            onChange={e => handleSelectProduct(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all"
                          >
                            <option value="" className="bg-slate-900">Select Product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} className="bg-slate-900">
                                {p.name} (Stock: {p.qty})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right text-slate-300 font-mono">${item.selling_price.toFixed(2)}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={e => handleQtyChange(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-purple-500/40 transition-all"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount || 0}
                            onChange={e => handleDiscountChange(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-purple-500/40 transition-all"
                          />
                        </td>
                        <td className="p-3 text-right text-white font-semibold">${discountedSubtotal(item).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end">
              <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-medium">Total Amount:</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
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
              onClick={handleSaveTransaction}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}