'use client'

import React, { useState } from 'react'
import { User, TrendingUp, Package, DollarSign, AlertTriangle, Sparkles, BarChart3, Calendar, ArrowUp, ArrowDown, ShoppingCart, Send, Target, LineChart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useRef } from 'react'
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

interface Message {
  content: string
  type: 'user' | 'bot' | 'forecast'
  data?: ForecastData
}

interface ForecastData {
  product: string
  historical_sales: number[]
  forecasted_demand: number
  current_stock: number
  stock_coverage: number
  reorder_qty: number
  trend_score: number
  trend_change: number
  base_cost: number
  suggested_price: number
  ai_insight: string
}

type Tab = 'home' | 'product' | 'inventory' | 'finance' | 'customer' | 'messages' | 'setting' | 'Supplier'

// Home Component
const Home: React.FC<{ userData: UserData }> = ({ userData }) => {
  const [showProfile, setShowProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const toggleProfile = () => setShowProfile(prev => !prev)

  const parseForecastResponse = (text: string): ForecastData | null => {
    try {
      const productMatch = text.match(/Product:\s*(.+)/i)
      const historicalMatch = text.match(/Historical Sales.*:\s*\[([^\]]+)\]/i)
      const forecastMatch = text.match(/Forecasted Demand:\s*(\d+)/i)
      const stockMatch = text.match(/Current Stock:\s*(\d+)/i)
      const coverageMatch = text.match(/Stock Coverage:\s*(\d+)%/i)
      const reorderMatch = text.match(/Suggested Reorder Quantity:\s*(\d+)/i)
      const trendScoreMatch = text.match(/Google Trends.*:\s*(\d+)\/100/i)
      const trendChangeMatch = text.match(/by\s*(\d+)/i)
      const baseCostMatch = text.match(/Base\s*\$?([\d.]+)/i)
      const suggestedPriceMatch = text.match(/Suggested\s*\$?([\d.]+)/i)
      const insightMatch = text.match(/AI Recommendation:\s*([\s\S]+)/i)

      if (!productMatch) return null

      return {
        product: productMatch[1].trim(),
        historical_sales: historicalMatch ? historicalMatch[1].split(',').map(n => parseInt(n.trim())) : [],
        forecasted_demand: forecastMatch ? parseInt(forecastMatch[1]) : 0,
        current_stock: stockMatch ? parseInt(stockMatch[1]) : 0,
        stock_coverage: coverageMatch ? parseInt(coverageMatch[1]) : 0,
        reorder_qty: reorderMatch ? parseInt(reorderMatch[1]) : 0,
        trend_score: trendScoreMatch ? parseInt(trendScoreMatch[1]) : 50,
        trend_change: trendChangeMatch ? parseInt(trendChangeMatch[1]) : 0,
        base_cost: baseCostMatch ? parseFloat(baseCostMatch[1]) : 0,
        suggested_price: suggestedPriceMatch ? parseFloat(suggestedPriceMatch[1]) : 0,
        ai_insight: insightMatch ? insightMatch[1].trim() : ''
      }
    } catch (e) {
      console.error('Parse error:', e)
      return null
    }
  }

  const handleForecast = async () => {
    if (!query.trim()) return
    
    setMessages(prev => [...prev, { content: query, type: 'user' }])
    setQuery('')
    setIsTyping(true)

    try {
      const idToken = await auth.currentUser?.getIdToken()
      const response = await fetch('http://localhost:3001/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ query })
      })
      const data = await response.json()

      const botMessage = data?.readable_text || 'Sorry, I could not generate a response.'
      const forecastData = parseForecastResponse(botMessage)

      setTimeout(() => {
        if (forecastData) {
          setMessages(prev => [...prev, { 
            content: botMessage, 
            type: 'forecast',
            data: forecastData 
          }])
        } else {
          setMessages(prev => [...prev, { content: botMessage, type: 'bot' }])
        }
        setIsTyping(false)
      }, 500)
    } catch (error) {
      console.error('Forecast error:', error)
      setMessages(prev => [...prev, { content: 'Failed to fetch forecast', type: 'bot' }])
      setIsTyping(false)
    }
  }

  const ForecastCard: React.FC<{ data: ForecastData }> = ({ data }) => {
    const isLowStock = data.stock_coverage < 50
    const isHighDemand = data.trend_score > 70

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl shadow-purple-500/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-white">{data.product}</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
            isHighDemand 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
              : 'bg-slate-700/50 border border-slate-600/50 text-slate-300'
          }`}>
            <TrendingUp className="w-4 h-4" />
            {data.trend_score}/100
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            icon={<TrendingUp className="w-5 h-5" />}
            label="Forecasted Demand"
            value={`${data.forecasted_demand} units`}
            color="purple"
          />
          <MetricCard 
            icon={<Package className="w-5 h-5" />}
            label="Current Stock"
            value={`${data.current_stock} units`}
            color={isLowStock ? "red" : "green"}
          />
          <MetricCard 
            icon={<DollarSign className="w-5 h-5" />}
            label="Suggested Price"
            value={`$${data.suggested_price}`}
            color="pink"
          />
          <MetricCard 
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Reorder Quantity"
            value={`${data.reorder_qty} units`}
            color="blue"
          />
        </div>

        {isLowStock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg backdrop-blur-sm"
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <p className="font-semibold text-red-300">Low Stock Alert</p>
                <p className="text-sm text-red-400">Only {data.stock_coverage}% coverage. Order {data.reorder_qty} units immediately.</p>
              </div>
            </div>
          </motion.div>
        )}

        {data.historical_sales.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Last 3 Months Sales
            </h4>
            <div className="flex items-end justify-between h-32 bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
              {data.historical_sales.map((sale, idx) => {
                const maxSale = Math.max(...data.historical_sales)
                const height = (sale / maxSale) * 100
                return (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-1 mx-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg relative group cursor-pointer hover:from-purple-700 hover:to-pink-600 transition-colors"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-purple-500/30">
                      {sale} units
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 mb-6">
          <div className="flex items-center mb-3">
            <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
            <h4 className="font-semibold text-white">AI Recommendations</h4>
          </div>
          <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {data.ai_insight}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:scale-105 active:scale-95">
            Order Now
          </button>
          <button className="flex-1 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-purple-300 font-semibold py-3 px-4 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all">
            View Details
          </button>
        </div>
      </motion.div>
    )
  }

  const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = 
    ({ icon, label, value, color }) => {
    const colorClasses = {
      purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      red: 'bg-red-500/20 border-red-500/30 text-red-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400',
      pink: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 transition-all hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div className={`w-10 h-10 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-2`}>
          {icon}
        </div>
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="relative">
          <button
            className="p-3 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/50 text-white transition-all hover:scale-110 active:scale-95"
            onClick={toggleProfile}
          >
            <User className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-72 bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-500/30 text-white rounded-xl shadow-2xl shadow-purple-500/20 p-5 z-50"
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-purple-500/30">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{userData.name}</h4>
                    <p className="text-xs text-slate-400">{userData.role || 'user'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">Email:</span>
                    <span className="text-white">{userData.email}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 border border-purple-500/20">
        <div className="mb-6">
          <p className="text-xl md:text-2xl text-slate-300">
            Welcome back, <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">{userData.name}</span> 
          </p>
          <p className="text-sm text-slate-400 mt-1">Here's what's happening with your business today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-gradient-to-br from-purple-600 to-purple-700 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/30 text-white transition-all hover:shadow-xl hover:shadow-purple-500/50 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold opacity-90">Total Sales</h3>
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-black mb-1">Rs.233</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowUp className="w-3 h-3" />
              <span>12% from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-gradient-to-br from-pink-600 to-pink-700 backdrop-blur-xl rounded-2xl shadow-lg shadow-pink-500/30 text-white transition-all hover:shadow-xl hover:shadow-pink-500/50 border border-pink-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold opacity-90">Monthly Revenue</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-black mb-1">Rs.2323</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowUp className="w-3 h-3" />
              <span>8% from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/30 text-white transition-all hover:shadow-xl hover:shadow-blue-500/50 border border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold opacity-90">Orders</h3>
              <ShoppingCart className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-black mb-1">23</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowDown className="w-3 h-3" />
              <span>3% from last month</span>
            </div>
          </motion.div>
        </div>

        <div className="p-6 bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">NexaBiz AI</h2>
              <p className="text-xs text-slate-400">Your intelligent business assistant</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'user' ? (
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-md shadow-lg shadow-purple-500/30">
                      {msg.content}
                    </div>
                  ) : msg.type === 'forecast' && msg.data ? (
                    <div className="w-full">
                      <ForecastCard data={msg.data} />
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 backdrop-blur-sm text-white p-4 rounded-2xl rounded-tl-sm max-w-md shadow-lg border border-purple-500/20">
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-purple-500/20">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask about demand, orders, or stock..."
              className="flex-1 border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm text-white placeholder-slate-400 p-4 rounded-xl focus:outline-none focus:border-purple-500/60 transition-all"
              onKeyDown={e => e.key === 'Enter' && handleForecast()}
            />
            <button
              onClick={handleForecast}
              disabled={!query.trim()}
              className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 hover:shadow-xl hover:shadow-purple-500/50 disabled:from-slate-600 disabled:to-slate-700 text-white p-4 rounded-xl transition-all disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:transform-none disabled:shadow-none"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home