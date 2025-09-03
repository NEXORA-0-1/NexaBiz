'use client'

import { useState } from 'react'
import TransactionModal from '../inventory/TransactionModal'
import AddStockModal from '../inventory/AddStockModal'
import TrnsactionList from '../inventory/TrnsactionList'
import AddStockList from '../inventory/AddStockList'


export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'stocks'>('transactions')
  const [showStockModal, setShowStockModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh) // Force lists to re-fetch
  }

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-300">
        <button
          className={`px-4 py-2 -mb-px font-semibold rounded-t ${
            activeTab === 'transactions'
              ? 'bg-white border border-b-0 border-gray-300'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`px-4 py-2 -mb-px font-semibold rounded-t ${
            activeTab === 'stocks'
              ? 'bg-white border border-b-0 border-gray-300'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('stocks')}
        >
          Stock
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center mb-4 gap-2">
        {activeTab === 'transactions' && (
          <button
            onClick={() => setShowTransactionModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Transaction
          </button>
        )}
        {activeTab === 'stocks' && (
          <button
            onClick={() => setShowStockModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Stock
          </button>
        )}
      </div>

      {/* Lists */}
      <div>
        {activeTab === 'transactions' && (
          <TrnsactionList key={refresh ? 'refresh-1' : 'refresh-0'} />
        )}
        {activeTab === 'stocks' && (
          <AddStockList key={refresh ? 'refresh-1' : 'refresh-0'} />
        )}
      </div>

      {/* Modals */}
      {showStockModal && (
        <AddStockModal
          onClose={() => setShowStockModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      {showTransactionModal && (
        <TransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}
