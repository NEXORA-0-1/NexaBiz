'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { FaTrash, FaChevronDown, FaChevronUp, FaShoppingBag, FaCalendarAlt, FaReceipt } from 'react-icons/fa'

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
    <div className="mt-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <FaReceipt className="text-3xl text-blue-600 dark:text-blue-400" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transactions</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <FaShoppingBag className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No transactions yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => {
            const isExpanded = expandedId === tx.id
            const itemCount = tx.items.length

            return (
              <div
                key={tx.id}
                className="rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="p-5 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleToggleExpand(tx.id)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {tx.cus_name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaReceipt className="text-xs" />
                          <span className="font-mono text-xs">{tx.tid}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-xs" />
                          <span>
                            {tx.createdAt?.toDate
                              ? new Date(tx.createdAt.toDate()).toLocaleString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                          ${tx.total_amount?.toFixed(2)}
                        </div>
                      </div>
                      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2">
                        {isExpanded ? <FaChevronUp size={20} /> : <FaChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FaShoppingBag />
                        Purchased Items
                      </h4>
                      
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                              <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Discount
                              </th>
                              <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Subtotal
                              </th>
                              <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Final
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800">
                            {tx.items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                                  {item.product_name}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                                  ${item.selling_price.toFixed(2)}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                    {item.qty}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {item.discount ? (
                                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-semibold">
                                      {item.discount}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                                  ${item.subtotal.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                  ${(item.discounted_subtotal ?? item.subtotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleDelete(tx.id)
                          }}
                          disabled={deleteLoading === tx.id}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                        >
                          <FaTrash />
                          {deleteLoading === tx.id ? 'Deleting...' : 'Delete Transaction'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}