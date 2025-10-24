'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash, FaEdit } from 'react-icons/fa'
// import EditCustomerModal from './EditCustomerModal' // You’ll build this similar to EditProductModal




export default function MyCustomerList() {
  const [customers, setCustomers] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userCustomersRef = collection(db, 'users', user.uid, 'customers')

    const unsubscribe = onSnapshot(userCustomersRef, snapshot => {
      const customerList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCustomers(customerList)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirmDelete = window.confirm('Are you sure you want to delete this customer?')
    if (!confirmDelete) return

    await deleteDoc(doc(db, 'users', user.uid, 'customers', id))
    alert('Customer deleted')
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">My Customers</h2>

      {customers.length === 0 ? (
        <p className="text-gray-300">No customers added yet.</p>
      ) : (
        <div className="space-y-4">
          {customers.map(customer => (
            <div
              key={customer.id}
              className={`rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 border-blue-500`}
              onClick={() => handleToggleExpand(customer.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{customer.customer_name}</h3>
                  <p className="text-sm text-gray-600">
                    {customer.customer_id} — {customer.business_type}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {customer.location}
                </span>
              </div>

              {expandedId === customer.id && (
                <div className="mt-4 border-t pt-4 space-y-1">
                  <p>
                    <strong>Customer ID:</strong> {customer.customer_id}
                  </p>
                  <p>
                    <strong>Business Type:</strong> {customer.business_type}
                  </p>
                  <p>
                    <strong>Location:</strong> {customer.location}
                  </p>
                  <p>
                    <strong>Created At:</strong>{' '}
                    {customer.createdAt?.toDate
                      ? new Date(customer.createdAt.toDate()).toLocaleString()
                      : 'N/A'}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(customer.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash />
                      Delete
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingCustomer(customer)
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

      {/* {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )} */}
    </div>
  )
}
