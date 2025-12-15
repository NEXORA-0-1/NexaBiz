'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { Trash2, Edit3, ChevronDown, ChevronUp, Package, DollarSign, Layers, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import EditProductModal from './EditProductModal'

export default function MyProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // Fetch materials
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const userMaterialsRef = collection(db, 'users', user.uid, 'materials')
    const unsubscribe = onSnapshot(userMaterialsRef, snapshot => {
      const materialList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMaterials(materialList)
    })
    return () => unsubscribe()
  }, [])

  // Fetch products
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const userProductsRef = collection(db, 'users', user.uid, 'products')
    const unsubscribe = onSnapshot(userProductsRef, snapshot => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
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
  }

  const getMaterialName = (material_id: string) => {
    const material = materials.find(m => m.material_id === material_id)
    return material ? material.material_name : material_id || 'Unknown'
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Products Yet</h3>
          <p className="text-slate-500 text-center">Start adding products to manage your inventory</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div
                className={`
                  bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 cursor-pointer
                  ${expandedId === product.id 
                    ? 'border-purple-500/40 shadow-xl shadow-purple-500/10' 
                    : 'border-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5'
                  }
                `}
                onClick={() => handleToggleExpand(product.id)}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${product.stock_amount === 0 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : 'bg-green-500/10 border border-green-500/20'
                      }
                    `}>
                      <Package className={`w-6 h-6 ${product.stock_amount === 0 ? 'text-red-400' : 'text-green-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{product.product_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-slate-400">{product.product_id}</p>
                        <span className="text-slate-600">•</span>
                        <p className="text-sm font-semibold text-purple-400">{formatPrice(product.base_cost_usd)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5
                      ${product.stock_amount === 0
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400'
                      }
                    `}>
                      {product.stock_amount === 0 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          {product.stock_amount} units
                        </>
                      )}
                    </div>

                    {expandedId === product.id ? (
                      <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === product.id && (
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
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Category</p>
                                <p className="text-sm font-semibold text-white">{product.category}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                                <Layers className="w-4 h-4 text-pink-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Material</p>
                                <p className="text-sm font-semibold text-white">{getMaterialName(product.material_id)}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{product.material_per_unit_kg} kg per unit</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Pricing</p>
                                <p className="text-sm font-semibold text-white">
                                  Cost: {formatPrice(product.base_cost_usd)}
                                </p>
                                <p className="text-xs text-green-400 mt-0.5">
                                  Suggested: {formatPrice(product.suggested_price_usd)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Stock Amount</p>
                                <p className="text-sm font-semibold text-white">{product.stock_amount} units</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Created At</p>
                                <p className="text-sm font-semibold text-white">
                                  {product.createdAt?.toDate
                                    ? new Date(product.createdAt.toDate()).toLocaleDateString()
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
                              setEditingProduct(product)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all duration-300 font-medium"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(product.id)
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

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}