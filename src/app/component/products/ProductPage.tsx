'use client'

import { useState } from 'react'
import ProductModal from '../products/ProductModal'
import MyProductList from '../products/MyProductList'
import RawMaterialModal from '../products/RawMaterialModal'
import RawMaterialList from '../products/RawMaterialList'

export default function ProductPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'raw'>('product')
  const [showModal, setShowModal] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const handleAddSuccess = () => {
    setRefresh(!refresh) // re-fetch MyProductList
  }

  return (
    <div className="p-6">
      {/* --- Tabs --- */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'product'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`ml-4 px-4 py-2 font-medium ${
            activeTab === 'raw'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Raw Materials
        </button>
      </div>

      {/* --- Tab Content --- */}
      {activeTab === 'product' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              + Add Product
            </button>
          </div>

          <MyProductList key={refresh ? 'refresh' : 'no-refresh'} />

          {showModal && (
            <ProductModal
              onClose={() => setShowModal(false)}
              onSuccess={handleAddSuccess}
            />
          )}
        </div>
      )}

      {activeTab === 'raw' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              + Add Raw Material
            </button>
          </div>

          <RawMaterialList />

          {showModal && (
            <RawMaterialModal
              onClose={() => setShowModal(false)}
              onSuccess={() => console.log('Added raw material!')}
            />
          )}
        </div>
      )}

    </div>
  )
}
