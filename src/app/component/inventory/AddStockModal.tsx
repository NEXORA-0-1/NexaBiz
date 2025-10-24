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
  suggested_price_usd: number
  material_id?: string
  material_per_unit_kg?: number
}

type ItemRow = {
  productId: string
  pid: string
  product_name: string
  suggested_price_usd: number
  qty: number
}

export default function AddStockModal({ onClose, onSuccess }: Props) {
  const [supplierName, setSupplierName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const allSuppliers = supplierData as string[]

  // Fetch products
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
        suggested_price_usd: Number(d.data().suggested_price_usd || 0),
        material_id: d.data().material_id,
        material_per_unit_kg: Number(d.data().material_per_unit_kg || 0),
      }))
      setProducts(productList)
    }
    fetchProducts()
  }, [])

  const handleAddRow = () => {
    setItems([...items, { productId: '', pid: '', product_name: '', suggested_price_usd: 0, qty: 1 }])
  }

  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updated = [...items]
    updated[index] = {
      productId: product.id,
      pid: product.product_id,
      product_name: product.product_name,
      suggested_price_usd: product.suggested_price_usd,
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
    updated[index].suggested_price_usd = Math.max(0, Number(price))
    setItems(updated)
  }

  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.suggested_price_usd, 0)

  const handleSaveStock = async () => {
    const user = auth.currentUser
    if (!user) return alert('User not logged in')
    if (!supplierName.trim()) return alert('Enter supplier name')
    if (items.length === 0) return alert('Add at least one product')
    if (items.some(i => !i.productId)) return alert('Select product on all rows')

    try {
      // Merge duplicate products
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

        // 1️⃣ Increase product stock
        await updateDoc(productRef, {
          stock_amount: (product.stock_amount || 0) + item.qty,
        })

        // 2️⃣ Deduct material if product has a material_id
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

      // 3️⃣ Record stock transaction
      const stockRef = collection(db, 'users', user.uid, 'addstock')
      await addDoc(stockRef, {
        supplierName,
        items: mergedItems.map(i => ({
          pid: i.pid,
          product_name: i.product_name,
          suggested_price_usd: i.suggested_price_usd,
          qty: i.qty,
          subtotal: i.qty * i.suggested_price_usd,
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
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Stock</h2>

        <select
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-4"
          required
        >
          <option value="">Select Supplier</option>
          {allSuppliers.map(supplier => (
            <option key={supplier} value={supplier}>
              {supplier}
            </option>
          ))}
        </select>

        <table className="w-full border mb-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Selling price</th>
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
                        {p.product_name} (Stock: {p.stock_amount})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    min={0}
                    value={i.suggested_price_usd}
                    onChange={e => handlePriceChange(idx, e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
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
                  {(i.qty * i.suggested_price_usd).toFixed(2)}
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

        <div className="flex justify-end text-lg font-semibold mb-4">
          Total Bill: ${totalAmount.toFixed(2)}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveStock}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Save Stock
          </button>
        </div>
      </div>
    </div>
  )
}
