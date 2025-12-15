'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { Trash2, ChevronDown, ChevronUp, Layers, Calendar, AlertCircle, CheckCircle, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  }

  return (
    <div className="space-y-4">
      {materials.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
            <Layers className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Raw Materials Yet</h3>
          <p className="text-slate-500 text-center">Start adding raw materials to track your inventory</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div
                className={`
                  bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 cursor-pointer
                  ${expandedId === material.id 
                    ? 'border-pink-500/40 shadow-xl shadow-pink-500/10' 
                    : 'border-purple-500/10 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5'
                  }
                `}
                onClick={() => handleToggleExpand(material.id)}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${material.qty_kg === 0 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : 'bg-green-500/10 border border-green-500/20'
                      }
                    `}>
                      <Layers className={`w-6 h-6 ${material.qty_kg === 0 ? 'text-red-400' : 'text-green-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{material.material_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-slate-400">{material.material_id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5
                      ${material.qty_kg === 0
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400'
                      }
                    `}>
                      {material.qty_kg === 0 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          {material.qty_kg} kg
                        </>
                      )}
                    </div>

                    {expandedId === material.id ? (
                      <ChevronUp className="w-5 h-5 text-pink-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === material.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-purple-500/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                                <Hash className="w-4 h-4 text-pink-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Material ID</p>
                                <p className="text-sm font-semibold text-white">{material.material_id}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Layers className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Material Name</p>
                                <p className="text-sm font-semibold text-white">{material.material_name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Quantity Available</p>
                                <p className="text-sm font-semibold text-white">{material.qty_kg} kg</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Created At</p>
                                <p className="text-sm font-semibold text-white">
                                  {material.createdAt?.toDate
                                    ? new Date(material.createdAt.toDate()).toLocaleDateString()
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6 pt-4 border-t border-purple-500/10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(material.id)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}