'use client'

import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FaHome, 
  FaBox, 
  FaWarehouse, 
  FaChartLine, 
  FaUsers, 
  FaTruck, 
  FaEnvelope, 
  FaCog, 
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaChevronRight
} from 'react-icons/fa'
import Home from '../component/home'
import MyProductpage from '../component/products/ProductPage'
import MyInventorypage from '../component/inventory/InventoryPage'
import MySupplierPage from '../component/supplier/supplierPage'
import MyCustomerPage from '../component/customer/CustomerPage'
import MyMassegePage from '../component/messages/MessagePage'

interface UserData {
  userId: string
  name: string
  email: string
  role?: string
  approved: boolean
}

type Tab = 'home' | 'product' | 'inventory' | 'finance' | 'customer' | 'messages' | 'setting' | 'Supplier'

export default function UserDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
        setLoading(false)
      } else {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userData?.approved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserCircle className="text-4xl text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Waiting for Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account is pending admin approval. You'll receive an email once approved.
          </p>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  const menuItems: { label: string; tab: Tab; icon: any }[] = [
    { label: 'Home', tab: 'home', icon: FaHome },
    { label: 'Products', tab: 'product', icon: FaBox },
    { label: 'Inventory', tab: 'inventory', icon: FaWarehouse },
    { label: 'Finance', tab: 'finance', icon: FaChartLine },
    { label: 'Customers', tab: 'customer', icon: FaUsers },
    { label: 'Suppliers', tab: 'Supplier', icon: FaTruck },
    { label: 'Messages', tab: 'messages', icon: FaEnvelope },
    { label: 'Settings', tab: 'setting', icon: FaCog },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home userData={userData} />
      case 'product':
        return <MyProductpage />
      case 'inventory':
        return <MyInventorypage />
      case 'finance':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Finance</h2>
            <p className="text-gray-600 dark:text-gray-400">This is the Finance page content.</p>
          </div>
        )
      case 'customer':
        return <MyCustomerPage />
      case 'messages':
        return <MyMassegePage />
      case 'setting':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">This is the Settings page content.</p>
          </div>
        )
      case 'Supplier':
        return <MySupplierPage />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-gray-900 dark:text-white"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Static Sidebar */}
      <aside
        className={`
          fixed lg:fixed
          top-0 left-0 h-screen
          w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
          dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
          text-white
          flex flex-col
          shadow-2xl
          z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-700 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaBox className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nexabiz</h1>
              <p className="text-xs text-gray-400">Business Suite</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-700 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              {userData?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{userData?.name}</p>
              <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tab

              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
                    font-medium transition-all duration-200
                    relative
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className="text-xl" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <FaChevronRight className="text-sm" />}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-700 dark:border-gray-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FaSignOutAlt className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto lg:ml-72">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {activeTab === 'Supplier' ? 'Suppliers' : activeTab}
              </h2>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}