'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash, FaEdit } from 'react-icons/fa'
// import EditSupplierModal from './EditSupplierModal' // you’ll add this later

export default function MySupplierList() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userSuppliersRef = collection(db, 'users', user.uid, 'suppliers')

    const unsubscribe = onSnapshot(userSuppliersRef, snapshot => {
      const supplierList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setSuppliers(supplierList)
    })

    return () => unsubscribe()
  }, [])


  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirmDelete = window.confirm('Are you sure you want to delete this supplier?')
    if (!confirmDelete) return

    await deleteDoc(doc(db, 'users', user.uid, 'suppliers', id))
    alert('Supplier deleted successfully')
  }


  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">My Suppliers</h2>

      {suppliers.length === 0 ? (
        <p className="text-gray-400">No suppliers added yet.</p>
      ) : (
        <div className="space-y-4">
          {suppliers.map(supplier => (
            <div
              key={supplier.id}
              className="rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 border-green-500"
              onClick={() => handleToggleExpand(supplier.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{supplier.supplier_name}</h3>
                  <p className="text-sm text-gray-600">
                    {supplier.supplier_id} — {supplier.category}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {supplier.location}
                </span>
              </div>

              {expandedId === supplier.id && (
                <div className="mt-4 border-t pt-4 space-y-1">
                  <p>
                    <strong>Supplier ID:</strong> {supplier.supplier_id}
                  </p>
                  <p>
                    <strong>Category:</strong> {supplier.category}
                  </p>
                  <p>
                    <strong>Email:</strong> {supplier.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {supplier.phone}
                  </p>
                  <p>
                    <strong>Location:</strong> {supplier.location}
                  </p>
                  <p>
                    <strong>Created At:</strong>{' '}
                    {supplier.createdAt?.toDate
                      ? new Date(supplier.createdAt.toDate()).toLocaleString()
                      : 'N/A'}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(supplier.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash /> Delete
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingSupplier(supplier)
                      }}
                      className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Future Edit Modal */}
      {/* {editingSupplier && (
        <EditSupplierModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
        />
      )} */}
    </div>
  )
}
