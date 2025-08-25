'use client'


import { useEffect, useState } from 'react'
import ProductModal  from '../products/ProductModal'
import MyProductList  from '../products/MyProductList'

export default function ProductPage() {
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh) // Force MyProductList to re-fetch
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      <MyProductList />

      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}
