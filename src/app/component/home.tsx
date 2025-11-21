'use client'

import React, { useState } from 'react'
import { User, TrendingUp, Package, DollarSign, AlertTriangle, CheckCircle, ShoppingCart, Send, Sparkles, BarChart3, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
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
        className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-blue-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.product}</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
            isHighDemand 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            <TrendingUp className="w-4 h-4" />
            {data.trend_score}/100
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
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-6 rounded-r-lg"
          >
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">Low Stock Alert</p>
                <p className="text-sm text-red-600 dark:text-red-400">Only {data.stock_coverage}% coverage. Order {data.reorder_qty} units immediately.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Historical Sales Chart */}
        {data.historical_sales.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Last 3 Months Sales
            </h4>
            <div className="flex items-end justify-between h-32 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              {data.historical_sales.map((sale, idx) => {
                const maxSale = Math.max(...data.historical_sales)
                const height = (sale / maxSale) * 100
                return (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-1 mx-1 bg-linear-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-lg relative group cursor-pointer hover:from-blue-700 hover:to-blue-500 transition-colors"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                      {sale} units
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-3">
            <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI Recommendations</h4>
          </div>
          <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {data.ai_insight}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95">
            Order Now
          </button>
          <button className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold py-3 px-4 rounded-lg border-2 border-blue-600 dark:border-blue-500 transition-all">
            View Details
          </button>
        </div>
      </motion.div>
    )
  }

  const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = 
    ({ icon, label, value, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
      >
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-2`}>
          {icon}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </motion.div>
    )
  }

  return (
    <div className="relative min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="relative">
          <button
            className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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
                className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl p-5 z-50 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{userData.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userData.role || 'user'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100">{userData.email}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
            Welcome back, <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{userData.name}</span> 👋
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your business today</p>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-linear-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl shadow-lg text-white transition-all hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-1">Rs.233</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowUp className="w-3 h-3" />
              <span>12% from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-linear-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl shadow-lg text-white transition-all hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium opacity-90">Monthly Revenue</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-1">Rs.2323</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowUp className="w-3 h-3" />
              <span>8% from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-linear-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl shadow-lg text-white transition-all hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium opacity-90">Orders</h3>
              <ShoppingCart className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-1">23</p>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <ArrowDown className="w-3 h-3" />
              <span>3% from last month</span>
            </div>
          </motion.div>
        </div>

        {/* AI Chat Section */}
        <div className="mt-6 p-6 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nexabiz AI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your intelligent business assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
                    <div className="bg-linear-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-md shadow-lg">
                      {msg.content}
                    </div>
                  ) : msg.type === 'forecast' && msg.data ? (
                    <div className="w-full">
                      <ForecastCard data={msg.data} />
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-2xl rounded-tl-sm max-w-md shadow-lg border border-gray-200 dark:border-gray-700">
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
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask about demand, orders, or stock..."
              className="flex-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-4 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm"
              onKeyDown={e => e.key === 'Enter' && handleForecast()}
            />
            <button
              onClick={handleForecast}
              disabled={!query.trim()}
              className="bg-linear-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white p-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 disabled:transform-none"
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