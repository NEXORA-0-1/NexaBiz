'use client'

import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Home from '../component/home'
import MyProductpage  from '../component/products/ProductPage'
import MyInventorypage  from '../component/inventory/InventoryPage'
import MySupplierPage from '../component/supplier/supplierPage'

interface UserData {
  userId: string
  name: string
  email: string
  role?: string
  approved: boolean
}

type Tab = 'home' | 'product' | 'inventory' | 'finance' | 'setting'| 'Supplier'

export default function UserDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
        setLoading(false)
      } else {
        router.push('/login') // Redirect if not logged in
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) return <div className="p-4">Loading...</div>

  if (!userData?.approved) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Waiting for Approval</h1>
        <p>Your account is pending admin approval.</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    )
  }

  // Sidebar menu items
  const menuItems: { label: string; tab: Tab }[] = [
    { label: 'Home', tab: 'home' },
    { label: 'Product', tab: 'product' },
    { label: 'Inventory', tab: 'inventory' },
    { label: 'Finance', tab: 'finance' },
    {label: 'Supplier', tab: 'Supplier'},
    { label: 'Setting', tab: 'setting' },
  ]

  // Content for each tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home userData={userData} />
        )
      case 'product':
        return (
          <div>
            <MyProductpage />
          </div>
        )

      case 'inventory':
        return (
          <div>
            <MyInventorypage />
          </div>
        )

      case 'finance':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-2">Finance</h2>
            <p>This is the Finance page content.</p>
          </div>
        )
      case 'setting':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-2">Setting</h2>
            <p>This is the Setting page content.</p>
          </div>
        )
      case 'Supplier':
        return (
          <div>
            <MySupplierPage/>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">User Dashboard</h1>



        {/* Navigation */}
        <nav className="flex flex-col space-y-3 flex-grow">
          {menuItems.map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`text-left px-4 py-2 rounded ${
                activeTab === item.tab
                  ? 'bg-gray-600 font-semibold'
                  : 'hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-100">{renderContent()}</main>
    </div>
  )
}
