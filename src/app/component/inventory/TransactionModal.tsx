'use client'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
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
  pid: string
  name: string
  selling_price: number
}

type ItemRow = {
  pid: string
  product_name: string
  selling_price: number
  qty: number
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
        pid: d.data().pid,
        name: d.data().name,
        selling_price: d.data().selling_price
      }))
      setProducts(productList)
    }
    fetchProducts()
  }, [])

  // Add a blank row
  const handleAddRow = () => {
    setItems([...items, { pid: '', product_name: '', selling_price: 0, qty: 1 }])
  }

  // When product is selected from dropdown
  const handleSelectProduct = (index: number, pid: string) => {
    const product = products.find(p => p.pid === pid)
    if (!product) return
    const updated = [...items]
    updated[index] = {
      pid: product.pid,
      product_name: product.name,
      selling_price: product.selling_price,
      qty: updated[index].qty || 1
    }
    setItems(updated)
  }

  // Update quantity
  const handleQtyChange = (index: number, qty: string) => {
    const updated = [...items]
    updated[index].qty = Number(qty)
    setItems(updated)
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.selling_price, 0)

  // Save transaction
 const handleSaveTransaction = async () => {
  const user = auth.currentUser
  if (!user) return alert('User not logged in')

  const tid = generateTransactionID()
  const userTransactionsRef = collection(db, 'users', user.uid, 'transactions')

  await addDoc(userTransactionsRef, {
    tid,
    cus_name,
    items: items.map(i => ({
      ...i,
      subtotal: i.qty * i.selling_price
    })),
    total_amount: totalAmount,
    createdAt: new Date()
  })

  // ✅ Show success alert
  window.alert("✅ Transaction saved successfully!")

  onSuccess()
  onClose()
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
                    value={i.pid}
                    onChange={e => handleSelectProduct(idx, e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.pid} value={p.pid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border text-right">{i.selling_price}</td>
                <td className="p-2 border">
                  <input
                    type="number"
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
