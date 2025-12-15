'use client'

import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useState, useRef } from 'react'
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

// Animated Background Component
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      opacity: number
      color: string

      constructor(w: number, h: number) {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 1
        this.opacity = Math.random() * 0.3 + 0.1

        const colors = ['147, 51, 234', '236, 72, 153', '59, 130, 246']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update(w: number, h: number) {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > w) this.vx *= -1
        if (this.y < 0 || this.y > h) this.vy *= -1
      }

      draw(context: CanvasRenderingContext2D) {
        const gradient = context.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        )

        gradient.addColorStop(0, `rgba(${this.color}, ${this.opacity})`)
        gradient.addColorStop(1, `rgba(${this.color}, 0)`)

        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        context.fillStyle = gradient
        context.fill()
      }
    }

    for (let i = 0; i < 60; i++) {
      particles.push(new Particle(canvas.width, canvas.height))
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height)
        particle.draw(ctx)
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]

          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(147, 51, 234, ${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ display: 'block' }}
    />
  )
}

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
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 blur-xl bg-purple-500/30"></div>
        </div>
      </div>
    )
  }

  if (!userData?.approved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <AnimatedBackground />
        <div className="relative z-10 bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserCircle className="text-4xl text-yellow-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">
            Waiting for Approval
          </h1>
          <p className="text-slate-400 mb-6">
            Your account is pending admin approval. You'll receive an email once approved.
          </p>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
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
          <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Finance</h2>
            <p className="text-slate-400">This is the Finance page content.</p>
          </div>
        )
      case 'customer':
        return <MyCustomerPage />
      case 'messages':
        return <MyMassegePage />
      case 'setting':
        return (
          <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
            <p className="text-slate-400">This is the Settings page content.</p>
          </div>
        )
      case 'Supplier':
        return <MySupplierPage />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-br from-slate-900/90 to-purple-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-lg text-white hover:scale-110 transition-transform"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={`
          fixed lg:fixed
          top-0 left-0 h-screen
          w-72 
          bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-900
          backdrop-blur-2xl
          border-r border-purple-500/20
          flex flex-col
          shadow-2xl shadow-purple-500/10
          z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 hover:rotate-6 hover:scale-110 transition-all duration-300">
              <FaBox className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                NexaBiz
              </h1>
              <p className="text-xs text-slate-400">Business Suite</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
                {userData?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-950"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-white">{userData?.name}</p>
              <p className="text-xs text-slate-400 truncate">{userData?.email}</p>
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
                    font-medium transition-all duration-300
                    relative
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
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
        <div className="p-4 border-t border-purple-500/20 flex justify-center">
  <button
    onClick={handleLogout}
    className="
      flex items-center gap-3
      px-4 py-2
      rounded-lg
      text-slate-400
      hover:text-red-400
      hover:bg-red-500/10
      transition-all
      duration-200
    "
  >
    <FaSignOutAlt className="text-base" />
    <span className="text-sm">Logout</span>
  </button>
</div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto lg:ml-72 relative z-10">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-purple-500/20 shadow-lg shadow-purple-500/5">
          <div className="px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent capitalize">
                {activeTab === 'Supplier' ? 'Suppliers' : activeTab}
              </h2>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-xl backdrop-blur-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-green-300">Online</span>
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