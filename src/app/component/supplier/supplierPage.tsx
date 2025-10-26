'use client'

import { useState } from 'react'
import AddSupplierModal from './addSupplierModel'
import MySupplierList from './supplierList'
// import FindSupplier from './FindSupplier' // optional (future)

export default function SupplierPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'find'>('add')
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    // trigger re-render of supplier list
    setRefresh(!refresh)
  }

  return (
    <div className="p-6">
      {/* -------- Tabs Header -------- */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'add'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-600 hover:text-green-500'
          }`}
        >
          Add Supplier
        </button>
        <button
          onClick={() => setActiveTab('find')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'find'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-600 hover:text-green-500'
          }`}
        >
          Find Supplier
        </button>
      </div>

      {/* -------- Tabs Content -------- */}
      {activeTab === 'add' && (
        <div className="p-6">
          {/* Add Supplier Button */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              + Add Supplier
            </button>
          </div>

          {/* Supplier List */}
          <MySupplierList key={refresh ? 'refresh' : 'static'} />

          {/* Modal */}
          {showModal && (
            <AddSupplierModal
              onClose={() => setShowModal(false)}
              onSuccess={handleAddSuccess}
            />
          )}
        </div>
      )}

      {activeTab === 'find' && (
        <div className="p-6">
          {/* Add your FindSupplier component here later */}
          <p className="text-gray-600 italic">Find Supplier feature coming soon...</p>
        </div>
      )}
    </div>
  )
}
