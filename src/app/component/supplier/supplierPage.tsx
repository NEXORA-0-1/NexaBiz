'use client'
import { useState } from 'react'
import { Truck, Plus, Search, TrendingUp, Package, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AddSupplierModal from './addSupplierModel'
import MySupplierList from './supplierList'

export default function SupplierPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'find'>('add')
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh)
  }

  return (
    <>
      <div className={`space-y-6 ${showModal ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Supplier Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage your supplier relationships</p>
          </div>
          
          {/* Add Supplier Button */}
          {activeTab === 'add' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/30 text-white font-semibold rounded-xl transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Add Supplier</span>
            </motion.button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Total Suppliers</p>
                <p className="text-2xl font-black text-white">48</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Active Suppliers</p>
                <p className="text-2xl font-black text-white">32</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Total Orders</p>
                <p className="text-2xl font-black text-white">156</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('add')}
            className={`
              relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
              ${activeTab === 'add'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Suppliers
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('find')}
            className={`
              relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
              ${activeTab === 'find'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Supplier
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'add' && (
            <motion.div
              key="suppliers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">Supplier List</h2>
                <p className="text-sm text-slate-500">View and manage all suppliers</p>
              </div>

              <MySupplierList key={refresh ? 'refresh' : 'static'} />
            </motion.div>
          )}

          {activeTab === 'find' && (
            <motion.div
              key="find"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
            >
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Find Supplier</h3>
                <p className="text-slate-500 text-center">This feature is coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal - Outside blurred content */}
      {showModal && (
        <AddSupplierModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </>
  )
}