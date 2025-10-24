'use client'

import { useState } from 'react'
import CustomerModal from '../customer/AddCustomerModel'
import CustomerList from '../customer/CustomerList'
import FindCustomer from '../customer/FindCustomer' 

export default function CustomerPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'find'>('add')
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
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
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
        >
          Add Customer
        </button>
        <button
          onClick={() => setActiveTab('find')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'find'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
        >
          Find Customer
        </button>
      </div>

      {/* -------- Tabs Content -------- */}
      {activeTab === 'add' && (
        <div className="p-6"> 
        <div className="flex justify-between items-center mb-4">
           <button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" > + Add Customer </button> </div> <CustomerList /> {showModal && ( <CustomerModal onClose={() => setShowModal(false)} onSuccess={handleAddSuccess} /> )} </div>
      )}

      {activeTab === 'find' && (
        <div>
          <FindCustomer />
        </div>
      )}
    </div>
  )
}
