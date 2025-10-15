'use client'

import { useState } from 'react'
import CustomerModal from '../customer/AddCustomerModel'
import CustomerList from '../customer/CustomerList'

export default function CustomerPage() {
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh) // Trigger refresh in MyCustomerList
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Customer
        </button>
      </div>

      <CustomerList />

      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}
