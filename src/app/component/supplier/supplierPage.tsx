'use client'

import { useState } from 'react'
import AddSupplierModal from './addSupplierModel'
import MySupplierList from './supplierList'
import SupplierReplies from './supplierReplies';
// import FindSupplier from './FindSupplier' // optional (future)

export default function SupplierPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'replies'>('add')
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
          onClick={() => setActiveTab('replies')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'replies'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-600 hover:text-green-500'
          }`}
        >
        Supplier Replies
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

      {activeTab === 'replies' && (
        <div className="p-6">
          <SupplierReplies />
        </div>
      )}
    </div>
  )
}
