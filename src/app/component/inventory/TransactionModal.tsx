'use client'

import { auth, db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

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
  id: string        // Firestore document ID
  pid: string       // Your product code field
  name: string
  selling_price: number
  qty: number       // Current stock in product doc
}

type ItemRow = {
  productId: string     // Firestore document ID (for updates)
  pid: string           // Snapshot of product code
  product_name: string  // Snapshot of name
  selling_price: number // Snapshot of price
  qty: number           // Quantity to sell
}

export default function AddTransactionModal({ onClose, onSuccess }: Props) {
  const [cus_name, setCusName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ItemRow[]>([])

  // Load available products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      const user = auth.currentUser
      if (!user) return

      const snap = await getDocs(collection(db, 'users', user.uid, 'products'))
      const productList: Product[] = snap.docs.map(d => ({
        id: d.id,
        pid: d.data().pid,
        name: d.data().name,
        selling_price: Number(d.data().selling_price || 0),
        qty: Number(d.data().qty || 0),
      }))
      setProducts(productList)
    }
    fetchProducts()
  }, [])

  // Add a blank row
  const handleAddRow = () => {
    setItems(prev => [
      ...prev,
      { productId: '', pid: '', product_name: '', selling_price: 0, qty: 1 }
    ])
  }

  // When product is selected from dropdown
  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updated = [...items]
    updated[index] = {
      productId: product.id,
      pid: product.pid,
      product_name: product.name,
      selling_price: product.selling_price,
      qty: updated[index]?.qty || 1
    }
    setItems(updated)
  }

  // Update quantity
  const handleQtyChange = (index: number, qtyStr: string) => {
    const qty = Math.max(1, Number(qtyStr || 0))
    const updated = [...items]
    updated[index].qty = qty
    setItems(updated)
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.selling_price, 0)

  // Save transaction (with stock checks + deductions)
  const handleSaveTransaction = async () => {
    const user = auth.currentUser
    if (!user) return window.alert('User not logged in')
    if (!cus_name.trim()) return window.alert('Please enter customer name')
    if (items.length === 0) return window.alert('Add at least one product')
    if (items.some(i => !i.productId)) return window.alert('Please select a product on all rows')

    // Merge duplicate rows by productId
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
    const mergedTotal = mergedItems.reduce((s, i) => s + i.qty * i.selling_price, 0)

    const tid = generateTransactionID()
    const userTransactionsRef = collection(db, 'users', user.uid, 'transactions')

    try {
      await runTransaction(db, async (tx) => {
        // 1) Validate and deduct stock for each product
        for (const item of mergedItems) {
          const productRef = doc(db, 'users', user.uid, 'products', item.productId)
          const productSnap = await tx.get(productRef)

          if (!productSnap.exists()) {
            throw new Error(`Product not found: ${item.product_name || item.pid}`)
          }

          const data = productSnap.data() as any
          const currentQty = Number(data.qty || 0)

          if (item.qty > currentQty) {
            throw new Error(
              `Not enough stock for ${item.product_name}. Available: ${currentQty}, Requested: ${item.qty}`
            )
          }

          tx.update(productRef, { qty: currentQty - item.qty })
        }

        // 2) Create transaction document (atomic with stock updates)
        const newTxRef = doc(userTransactionsRef)
        tx.set(newTxRef, {
          tid,
          cus_name,
          items: mergedItems.map(i => ({
            pid: i.pid,
            product_name: i.product_name,
            selling_price: i.selling_price,
            qty: i.qty,
            subtotal: i.qty * i.selling_price
          })),
          total_amount: mergedTotal,
          createdAt: new Date()
        })
      })

      window.alert('✅ Transaction saved & stock updated!')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      window.alert(`❌ Error: ${err.message}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Transaction</h2>

        <input
          type="text"
          value={cus_name}
          onChange={e => setCusName(e.target.value)}
          placeholder="Customer Name"
          className="border px-3 py-2 rounded w-full mb-4"
        />

        {/* Items Table */}
        <table className="w-full border mb-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td className="p-2 border">
                  <select
                    value={i.productId}
                    onChange={e => handleSelectProduct(idx, e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.qty})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border text-right">
                  {i.selling_price.toFixed(2)}
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={e => handleQtyChange(idx, e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
                </td>
                <td className="p-2 border text-right">
                  {(i.qty * i.selling_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={handleAddRow}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded mb-3"
        >
          + Add Product
        </button>

        {/* Total */}
        <div className="flex justify-end text-lg font-semibold mb-4">
          Total: Rs. {totalAmount.toFixed(2)}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTransaction}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Save Transaction
          </button>
        </div>
      </div>
    </div>
  )
}
