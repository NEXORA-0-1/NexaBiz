'use client'

import { useState } from 'react'
import TransactionModal from '../inventory/TransactionModal'
import AddStockModal from '../inventory/AddStockModal'
import TrnsactionList from '../inventory/TrnsactionList'


export default function InventoryPage() {
  const [showStockModal, setShowStockModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh) // Force MyProductList to re-fetch
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 gap-2">
        {/* Stock Button */}
        <button
          onClick={() => setShowStockModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Stock
        </button>

        {/* Transaction Button */}
        <button
          onClick={() => setShowTransactionModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Transaction
        </button>
      </div>

      <TrnsactionList key={refresh ? 'refresh-1' : 'refresh-0'} />

      {/* Stock Modal */}
      {showStockModal && (
        <AddStockModal
          onClose={() => setShowStockModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}
