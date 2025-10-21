'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash, FaEdit } from 'react-icons/fa'
import EditProductModal from './EditProductModal'

export default function MyProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userProductsRef = collection(db, 'users', user.uid, 'products')

    const unsubscribe = onSnapshot(userProductsRef, snapshot => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(productList)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirm = window.confirm('Are you sure you want to delete this product?')
    if (!confirm) return

    await deleteDoc(doc(db, 'users', user.uid, 'products', id))
    alert('Product deleted')
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">My Products</h2>

      {products.length === 0 ? (
        <p className="text-gray-300">No products added yet.</p>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div
              key={product.id}
              className={`rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 ${
                product.stock_amount === 0 ? 'border-red-500' : 'border-green-500'
              }`}
              onClick={() => handleToggleExpand(product.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{product.product_name}</h3>
                  <p className="text-sm text-gray-600">
                    {product.product_id} — {formatPrice(product.base_cost_usd)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    product.stock_amount === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {product.stock_amount === 0
                    ? 'Out of Stock'
                    : `Qty: ${product.stock_amount}`}
                </span>
              </div>

              {expandedId === product.id && (
                <div className="mt-4 border-t pt-4 space-y-1">
                  <p>
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p>
                    <strong>Material:</strong> {product.material_type}
                  </p>
                  <p>
                    <strong>Material per Unit:</strong> {product.material_per_unit_kg} kg
                  </p>
                  <p>
                    <strong>Base Cost:</strong> {formatPrice(product.base_cost_usd)}
                  </p>
                  <p>
                    <strong>Suggested Price:</strong> {formatPrice(product.suggested_price_usd)}
                  </p>
                  <p>
                    <strong>Stock Amount:</strong> {product.stock_amount}
                  </p>
                  <p>
                    <strong>Created At:</strong>{' '}
                    {product.createdAt?.toDate
                      ? new Date(product.createdAt.toDate()).toLocaleString()
                      : 'N/A'}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(product.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash />
                      Delete
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingProduct(product)
                      }}
                      className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      <FaEdit />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}
