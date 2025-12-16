'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { X, Package, Plus, Trash2, TrendingUp, DollarSign, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import supplierData from '@/src/data/supplierDummy.json'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

type Product = {
  id: string
  product_id: string
  product_name: string
  stock_amount: number
  base_cost_usd: number
  material_id?: string
  material_per_unit_kg?: number
}

type ItemRow = {
  productId: string
  pid: string
  product_name: string
  base_cost_usd: number
  qty: number
}

export default function AddStockModal({ onClose, onSuccess }: Props) {
  const [supplierName, setSupplierName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const allSuppliers = supplierData as string[]

  useEffect(() => {
    const fetchProducts = async () => {
      const user = auth.currentUser
      if (!user) return

      const snap = await getDocs(collection(db, 'users', user.uid, 'products'))
      const productList: Product[] = snap.docs.map(d => ({
        id: d.id,
        product_id: d.data().product_id,
        product_name: d.data().product_name,
        stock_amount: Number(d.data().stock_amount || 0),
        base_cost_usd: Number(d.data().base_cost_usd || 0),
        material_id: d.data().material_id,
        material_per_unit_kg: Number(d.data().material_per_unit_kg || 0),
      }))
      setProducts(productList)
    }
    fetchProducts()
  }, [])

  const handleAddRow = () => {
    setItems([...items, { productId: '', pid: '', product_name: '', base_cost_usd: 0, qty: 1 }])
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
      pid: product.product_id,
      product_name: product.product_name,
      base_cost_usd: product.base_cost_usd,
      qty: updated[index]?.qty || 1,
    }
    setItems(updated)
  }

  const handleQtyChange = (index: number, qty: string) => {
    const updated = [...items]
    updated[index].qty = Math.max(1, Number(qty))
    setItems(updated)
  }

  const handlePriceChange = (index: number, price: string) => {
    const updated = [...items]
    updated[index].base_cost_usd = Math.max(0, Number(price))
    setItems(updated)
  }

  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.base_cost_usd, 0)

  const handleSaveStock = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')
    if (!supplierName.trim()) return alert('Enter supplier name')
    if (items.length === 0) return alert('Add at least one product')
    if (items.some(i => !i.productId)) return alert('Select product on all rows')

    try {
      setLoading(true)
      const mergedMap = new Map<string, ItemRow>()
      for (const i of items) {
        const key = i.productId
        if (!mergedMap.has(key)) mergedMap.set(key, { ...i })
        else {
          const prev = mergedMap.get(key)!
          mergedMap.set(key, { ...prev, qty: prev.qty + i.qty })
        }
      }
      const mergedItems = Array.from(mergedMap.values())

      for (const item of mergedItems) {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue

        const productRef = doc(db, 'users', user.uid, 'products', item.productId)

        await updateDoc(productRef, {
          stock_amount: (product.stock_amount || 0) + item.qty,
        })

        if (product.material_id) {
          const materialQuery = query(
            collection(db, 'users', user.uid, 'materials'),
            where('material_id', '==', product.material_id)
          )
          const materialSnap = await getDocs(materialQuery)
          if (materialSnap.empty) {
            console.warn(`Material not found for ID: ${product.material_id}`)
          } else {
            const materialDoc = materialSnap.docs[0]
            const materialData = materialDoc.data()
            const currentQty = Number(materialData.qty_kg || 0)
            const usedMaterial = item.qty * (product.material_per_unit_kg || 0)
            const newQty = Math.max(0, currentQty - usedMaterial)
            await updateDoc(materialDoc.ref, { qty_kg: newQty })
            console.log(`Deducted ${usedMaterial}kg from material ${product.material_id}`)
          }
        }
      }

      const stockRef = collection(db, 'users', user.uid, 'addstock')
      await addDoc(stockRef, {
        supplierName,
        items: mergedItems.map(i => ({
          pid: i.pid,
          product_name: i.product_name,
          base_cost_usd: i.base_cost_usd,
          qty: i.qty,
          subtotal: i.qty * i.base_cost_usd,
        })),
        total: totalAmount,
        createdAt: serverTimestamp(),
      })

      alert('✅ Stock added successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      alert('❌ Error adding stock: ' + err.message)
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
          className="bg-slate-900/95 backdrop-blur-xl border border-pink-500/20 rounded-2xl shadow-2xl shadow-pink-500/10 w-full max-w-4xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="bg-slate-900/95 backdrop-blur-xl border-b border-pink-500/20 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Add Stock</h2>
                <p className="text-xs text-slate-500">Increase inventory from supplier</p>
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

            {/* Supplier Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                Supplier
              </label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-900/50 border border-pink-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/40 transition-all"
                required
              >
                <option value="" className="bg-slate-900">Select Supplier</option>
                {allSuppliers.map(supplier => (
                  <option key={supplier} value={supplier} className="bg-slate-900">
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Package className="w-4 h-4 text-purple-400" />
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

              <div className="overflow-x-auto rounded-xl border border-pink-500/20">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Cost</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity</th>
                      <th className="p-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Subtotal</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/30">
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-pink-500/10">
                        <td className="p-3">
                          <select
                            value={item.productId}
                            onChange={e => handleSelectProduct(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-pink-500/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/40 transition-all"
                          >
                            <option value="" className="bg-slate-900">Select Product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} className="bg-slate-900">
                                {p.product_name} (Stock: {p.stock_amount})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.base_cost_usd}
                            onChange={e => handlePriceChange(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-pink-500/20 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-pink-500/40 transition-all"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={e => handleQtyChange(idx, e.target.value)}
                            className="w-full bg-slate-900/50 border border-pink-500/20 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-pink-500/40 transition-all"
                          />
                        </td>
                        <td className="p-3 text-right text-white font-semibold">
                          ${(item.qty * item.base_cost_usd).toFixed(2)}
                        </td>
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
              <div className="bg-slate-900/50 border border-pink-500/20 rounded-xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-medium">Total Bill:</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
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
              onClick={handleSaveStock}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:shadow-xl hover:shadow-pink-500/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Stock'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}