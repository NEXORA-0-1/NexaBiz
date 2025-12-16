'use client'
import { useState } from 'react'
import { Package, TrendingUp, Plus, ShoppingCart, Box } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    setRefresh(!refresh)
  }

  return (
    <>
      <div className={`space-y-6 ${(showStockModal || showTransactionModal) ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track transactions and stock levels</p>
          </div>
          
          {/* Dynamic Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (activeTab === 'transactions') {
                setShowTransactionModal(true)
              } else {
                setShowStockModal(true)
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white font-semibold rounded-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Add {activeTab === 'transactions' ? 'Transaction' : 'Stock'}</span>
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Total Transactions</p>
                <p className="text-2xl font-black text-white">248</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Stock Items</p>
                <p className="text-2xl font-black text-white">156</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Revenue</p>
                <p className="text-2xl font-black text-white">$12.5K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`
              relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
              ${activeTab === 'transactions'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Transactions
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('stocks')}
            className={`
              relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
              ${activeTab === 'stocks'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Stock
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">Transaction History</h2>
                <p className="text-sm text-slate-500">View and manage all transactions</p>
              </div>

              <TrnsactionList key={refresh ? 'refresh-1' : 'refresh-0'} />
            </motion.div>
          )}

          {activeTab === 'stocks' && (
            <motion.div
              key="stocks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">Stock Management</h2>
                <p className="text-sm text-slate-500">Monitor inventory levels</p>
              </div>

              <AddStockList key={refresh ? 'refresh-1' : 'refresh-0'} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals - Outside blurred content */}
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
    </>
  )
}