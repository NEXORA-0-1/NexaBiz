'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash } from 'react-icons/fa'

type Transaction = {
  id: string
  tid: string
  cus_name: string
  total_amount: number
  createdAt: any
  items: {
    pid: string
    product_name: string
    selling_price: number
    qty: number
    subtotal: number
  }[]
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userTransactionsRef = collection(db, 'users', user.uid, 'transactions')

    const unsubscribe = onSnapshot(userTransactionsRef, snapshot => {
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

    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
    alert('Transaction deleted')
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Transactions</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-400">No transactions yet.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map(tx => (
            <div
              key={tx.id}
              className="rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 border-blue-500"
              onClick={() => handleToggleExpand(tx.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{tx.cus_name}</h3>
                  <p className="text-sm text-gray-600">
                    {tx.tid} — Rs. {tx.total_amount?.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {tx.createdAt?.toDate
                    ? new Date(tx.createdAt.toDate()).toLocaleString()
                    : 'N/A'}
                </span>
              </div>

              {/* Expanded items */}
              {expandedId === tx.id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Purchased Items</h4>
                  <div className="space-y-2">
                    {tx.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between border p-2 rounded bg-gray-50"
                      >
                        <span>{item.product_name}</span>
                        <span>
                          {item.qty} × Rs.{item.selling_price.toFixed(2)} ={' '}
                          <strong>Rs.{item.subtotal.toFixed(2)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(tx.id)
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
