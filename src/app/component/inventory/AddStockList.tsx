'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash } from 'react-icons/fa'

type Stock = {
  id: string
  supplierName: string
  total: number
  createdAt: any
  items: {
    pid: string
    product_name: string
    purchase_price: number
    qty: number
    subtotal: number
  }[]
}

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userStocksRef = collection(db, 'users', user.uid, 'stocks')

    const unsubscribe = onSnapshot(userStocksRef, snapshot => {
      const stockList: Stock[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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

    await deleteDoc(doc(db, 'users', user.uid, 'stocks', id))
    alert('Stock record deleted')
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Stock Records</h2>

      {stocks.length === 0 ? (
        <p className="text-gray-400">No stock records yet.</p>
      ) : (
        <div className="space-y-4">
          {stocks.map(stock => (
            <div
              key={stock.id}
              className="rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 border-green-500"
              onClick={() => handleToggleExpand(stock.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{stock.supplierName}</h3>
                  <p className="text-sm text-gray-600">
                    Total: Rs. {stock.total?.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {stock.createdAt?.toDate
                    ? new Date(stock.createdAt.toDate()).toLocaleString()
                    : 'N/A'}
                </span>
              </div>

              {expandedId === stock.id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Stocked Items</h4>
                  <div className="space-y-2">
                    {stock.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between border p-2 rounded bg-gray-50"
                      >
                        <span>{item.product_name}</span>
                        <span>
                          {item.qty} × Rs.{item.purchase_price.toFixed(2)} ={' '}
                          <strong>Rs.{item.subtotal.toFixed(2)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(stock.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
