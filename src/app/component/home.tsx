'use client'

import React, { useState } from 'react'
import { User, TrendingUp, Package, DollarSign, AlertTriangle, CheckCircle, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from "@/lib/firebase"

interface UserData {
  userId: string
  name: string
  email: string
  role?: string
  approved: boolean
}

interface HomeProps {
  userData: UserData
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

const Home: React.FC<HomeProps> = ({ userData }) => {
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
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{data.product}</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${isHighDemand ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            Trend: {data.trend_score}/100
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            icon={<TrendingUp className="w-5 h-5" />}
            label="Forecasted Demand"
            value={`${data.forecasted_demand} units`}
            color="blue"
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
            color="purple"
          />
          <MetricCard 
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Reorder Quantity"
            value={`${data.reorder_qty} units`}
            color="orange"
          />
        </div>

        {/* Stock Alert */}
        {isLowStock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <p className="font-semibold text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-600">Only {data.stock_coverage}% coverage. Order {data.reorder_qty} units immediately.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Historical Sales Chart */}
        {data.historical_sales.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Last 3 Months Sales</h4>
            <div className="flex items-end justify-between h-32 bg-white rounded-lg p-4 shadow-sm">
              {data.historical_sales.map((sale, idx) => {
                const maxSale = Math.max(...data.historical_sales)
                const height = (sale / maxSale) * 100
                return (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-1 mx-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative group cursor-pointer"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {sale} units
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="font-semibold text-gray-800">AI Recommendations</h4>
          </div>
          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
            {data.ai_insight}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-md hover:shadow-lg">
            Order Now
          </button>
          <button className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-4 rounded-lg border-2 border-blue-600 transition">
            View Details
          </button>
        </div>
      </motion.div>
    )
  }

  const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = 
    ({ icon, label, value, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
      >
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-2`}>
          {icon}
        </div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </motion.div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-blue-900 p-4 md:p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <div className="relative">
          <button
            className="p-2 rounded-full bg-blue-200 hover:bg-blue-300 transition"
            onClick={toggleProfile}
          >
            <User className="h-6 w-6 text-blue-900" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-64 bg-white text-blue-900 rounded-xl shadow-lg p-4 z-50"
              >
                <h4 className="text-lg font-semibold mb-2">User Info</h4>
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Role:</strong> {userData.role || 'user'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-8">
        <p className="text-lg md:text-xl mb-6">
          Welcome back, <span className="font-semibold">{userData.name}</span> 👋
        </p>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="p-4 md:p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-base md:text-lg font-semibold mb-2">Total Sales</h3>
            <p className="text-xl md:text-2xl font-bold">Rs.233</p>
          </div>
          <div className="p-4 md:p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-base md:text-lg font-semibold mb-2">Monthly Revenue</h3>
            <p className="text-xl md:text-2xl font-bold">Rs.2323</p>
          </div>
          <div className="p-4 md:p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-base md:text-lg font-semibold mb-2">Orders</h3>
            <p className="text-xl md:text-2xl font-bold">23</p>
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="mt-6 p-4 md:p-6 bg-blue-50 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Nexabiz AI</h2>

          {/* Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask about demand, orders, or stock..."
              className="border-2 border-blue-200 p-3 w-full rounded-lg focus:outline-none focus:border-blue-500 transition"
              onKeyDown={e => e.key === 'Enter' && handleForecast()}
            />
            <button
              onClick={handleForecast}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                    <div className="bg-blue-600 text-white p-3 rounded-lg max-w-md shadow-md">
                      {msg.content}
                    </div>
                  ) : msg.type === 'forecast' && msg.data ? (
                    <div className="w-full">
                      <ForecastCard data={msg.data} />
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-lg max-w-md shadow-md">
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
                  <div className="bg-white p-3 rounded-lg shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home