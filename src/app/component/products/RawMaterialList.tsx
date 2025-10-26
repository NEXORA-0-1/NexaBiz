'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { FaTrash } from 'react-icons/fa'

export default function RawMaterialList() {
  const [materials, setMaterials] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const userMaterialsRef = collection(db, 'users', user.uid, 'materials')

    const unsubscribe = onSnapshot(userMaterialsRef, (snapshot) => {
      const materialList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMaterials(materialList)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    const user = auth.currentUser
    if (!user) return

    const confirm = window.confirm('Are you sure you want to delete this material?')
    if (!confirm) return

    await deleteDoc(doc(db, 'users', user.uid, 'materials', id))
    alert('Material deleted')
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">My Raw Materials</h2>

      {materials.length === 0 ? (
        <p className="text-gray-400">No raw materials added yet.</p>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`rounded-lg shadow-md bg-white hover:shadow-lg transition duration-300 p-4 border-l-4 ${
                material.qty_kg === 0 ? 'border-red-500' : 'border-green-500'
              }`}
              onClick={() => handleToggleExpand(material.id)}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <h3 className="text-lg font-semibold">{material.material_name}</h3>
                  <p className="text-sm text-gray-600">{material.material_id}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    material.qty_kg === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {material.qty_kg === 0
                    ? 'Out of Stock'
                    : `${material.qty_kg} kg`}
                </span>
              </div>

              {expandedId === material.id && (
                <div className="mt-4 border-t pt-4 space-y-1">
                  <p>
                    <strong>Material ID:</strong> {material.material_id}
                  </p>
                  <p>
                    <strong>Name:</strong> {material.material_name}
                  </p>
                  <p>
                    <strong>Quantity (kg):</strong> {material.qty_kg}
                  </p>
                  <p>
                    <strong>Created At:</strong>{' '}
                    {material.createdAt?.toDate
                      ? new Date(material.createdAt.toDate()).toLocaleString()
                      : 'N/A'}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(material.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
