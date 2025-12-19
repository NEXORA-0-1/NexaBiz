'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Box,
  Receipt,
  Wallet
} from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'

interface RecentTransaction {
  id: string
  tid: string
  cus_name: string
  total_amount: number
  createdAt: any
  items: any[]
}

interface RecentStock {
  id: string
  supplierName: string
  total: number
  createdAt: any
  items: any[]
}

interface RawMaterial {
  id: string
  material_id: string
  material_name: string
  qty_kg: number
  createdAt: any
}

export default function InventoryFinanceDashboard() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month')
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [recentStocks, setRecentStocks] = useState<RecentStock[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate statistics
  const totalRevenue = recentTransactions.reduce((sum, tx) => sum + (tx.total_amount || 0), 0)
  const totalStockValue = recentStocks.reduce((sum, stock) => sum + (stock.total || 0), 0)
  const lowStockCount = rawMaterials.filter(m => m.qty_kg < 10).length
  const totalMaterials = rawMaterials.reduce((sum, m) => sum + m.qty_kg, 0)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    // Fetch recent transactions
    const transactionsRef = collection(db, 'users', user.uid, 'transactions')
    const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'), limit(5))
    const unsubTransactions = onSnapshot(transactionsQuery, snapshot => {
      const txList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecentTransaction[]
      setRecentTransactions(txList)
    })

    // Fetch recent stocks
    const stocksRef = collection(db, 'users', user.uid, 'addstock')
    const stocksQuery = query(stocksRef, orderBy('createdAt', 'desc'), limit(5))
    const unsubStocks = onSnapshot(stocksQuery, snapshot => {
      const stockList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecentStock[]
      setRecentStocks(stockList)
      setLoading(false)
    })

    // Fetch raw materials
    const materialsRef = collection(db, 'users', user.uid, 'materials')
    const unsubMaterials = onSnapshot(materialsRef, snapshot => {
      const materialList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RawMaterial[]
      setRawMaterials(materialList)
    })

    return () => {
      unsubTransactions()
      unsubStocks()
      unsubMaterials()
    }
  }, [])

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
      description: 'From sales'
    },
    {
      title: 'Stock Value',
      value: `$${totalStockValue.toFixed(2)}`,
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      description: 'Inventory worth'
    },
    {
      title: 'Raw Materials',
      value: `${totalMaterials.toFixed(1)} kg`,
      change: lowStockCount > 0 ? `-${lowStockCount} low` : '+5.3%',
      trend: lowStockCount > 0 ? 'down' : 'up',
      icon: Layers,
      gradient: 'from-pink-600 via-rose-600 to-red-600',
      description: 'Available stock'
    },
    {
      title: 'Total Transactions',
      value: recentTransactions.length.toString(),
      change: '+15.8%',
      trend: 'up',
      icon: Receipt,
      gradient: 'from-purple-600 via-pink-600 to-blue-600',
      description: 'This period'
    }
  ]

  const getColorForType = (type: 'transaction' | 'stock' | 'material') => {
    switch (type) {
      case 'transaction':
        return {
          bg: 'from-purple-500/20 via-pink-500/20 to-blue-500/20 border-purple-500/30',
          icon: 'text-purple-400',
          gradient: 'from-purple-400 to-pink-400'
        }
      case 'stock':
        return {
          bg: 'from-pink-500/20 via-rose-500/20 to-red-500/20 border-pink-500/30',
          icon: 'text-pink-400',
          gradient: 'from-pink-400 to-purple-400'
        }
      case 'material':
        return {
          bg: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20 border-blue-500/30',
          icon: 'text-blue-400',
          gradient: 'from-blue-400 to-indigo-400'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track your inventory financial metrics</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 group"
          >
            <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 group"
          >
            <Download className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative p-5 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              
              <p className="text-sm text-slate-500 font-medium mb-1">{stat.title}</p>
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-600">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Time Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
          {(['week', 'month', 'year'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`
                relative px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm
                ${timeFilter === filter
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
              `}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <Filter className="w-4 h-4" />
          Filter
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Recent Sales</h2>
            </div>
            <button className="text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No recent transactions</div>
            ) : (
              <AnimatePresence mode="popLayout">
                {recentTransactions.map((tx, index) => {
                  const colors = getColorForType('transaction')
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/30 rounded-lg p-4 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <ShoppingCart className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {tx.cus_name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <Receipt className="w-3 h-3" />
                              <span className="font-mono">{tx.tid}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-base font-black bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                            ${tx.total_amount?.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Recent Stock Additions */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-bold text-white">Recent Stock</h2>
            </div>
            <button className="text-sm text-pink-400 hover:text-pink-300 font-semibold transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : recentStocks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No recent stock additions</div>
            ) : (
              <AnimatePresence mode="popLayout">
                {recentStocks.map((stock, index) => {
                  const colors = getColorForType('stock')
                  return (
                    <motion.div
                      key={stock.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-pink-500/30 rounded-lg p-4 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Package className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {stock.supplierName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {stock.createdAt?.toDate
                                  ? new Date(stock.createdAt.toDate()).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-base font-black bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                            ${stock.total?.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stock.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Raw Materials Status */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Raw Materials Status</h2>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              {lowStockCount} Low Stock
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full text-center py-8 text-slate-500">Loading...</div>
          ) : rawMaterials.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-500">No raw materials found</div>
          ) : (
            rawMaterials.slice(0, 6).map((material, index) => {
              const isLowStock = material.qty_kg < 10
              const colors = getColorForType('material')
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    p-4 bg-slate-800/50 backdrop-blur-xl rounded-lg border transition-all duration-300
                    ${isLowStock 
                      ? 'border-red-500/30 hover:border-red-500/50' 
                      : 'border-slate-700/50 hover:border-blue-500/30'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                      isLowStock 
                        ? 'from-red-500/20 via-rose-500/20 to-pink-500/20 border-red-500/30' 
                        : colors.bg
                    } flex items-center justify-center border`}>
                      <Layers className={`w-5 h-5 ${isLowStock ? 'text-red-400' : colors.icon}`} />
                    </div>
                    {isLowStock && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        Low
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-semibold text-sm mb-1 truncate">
                    {material.material_name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2 font-mono">{material.material_id}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Available</span>
                    <span className={`text-sm font-bold ${
                      isLowStock ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {material.qty_kg} kg
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}