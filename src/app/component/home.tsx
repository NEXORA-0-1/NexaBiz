'use client'

import React, { useState } from 'react'
import { User, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'

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
  sender: 'user' | 'ai'
  content: string
}

const Home: React.FC<HomeProps> = ({ userData }) => {
  const [showProfile, setShowProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const toggleProfile = () => setShowProfile(prev => !prev)

  // -----------------------------
  // Handle Forecast / AI Query
  // -----------------------------
  const handleForecast = async () => {
    if (!query.trim()) return

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', content: query }])
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
      console.log('Raw AI response:', data)

      // Handle various AI response types
      const botMessage =
        data?.readable_text ||
        data?.summary ||
        data?.insight ||
        JSON.stringify(data, null, 2) ||
        'Sorry, I could not generate a response.'

      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', content: botMessage }])
        setIsTyping(false)
      }, 600)
    } catch (error) {
      console.error('Forecast error:', error)
      setMessages(prev => [
        ...prev,
        { sender: 'ai', content: '⚠️ Failed to connect to AI agent.' }
      ])
      setIsTyping(false)
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-blue-900 p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Profile */}
        <div className="relative">
          <button
            className="p-2 rounded-full bg-blue-200 hover:bg-blue-300"
            onClick={toggleProfile}
          >
            <User className="h-6 w-6 text-blue-900" />
          </button>

          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-64 bg-white text-blue-900 rounded-xl shadow-lg p-4 z-50"
            >
              <h4 className="text-lg font-semibold mb-2">User Info</h4>
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Role:</strong> {userData.role || 'User'}</p>
              <p><strong>Approved:</strong> {userData.approved ? '✅ Yes' : '❌ No'}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8">
        <p className="text-xl mb-4">
          Welcome back, <span className="font-semibold">{userData.name}</span> 👋
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
            <p className="text-2xl font-bold">Rs. 233</p>
          </div>
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
            <p className="text-2xl font-bold">Rs. 2,323</p>
          </div>
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Orders</h3>
            <p className="text-2xl font-bold">23</p>
          </div>
        </div>

        {/* NexaBiz AI */}
        <div className="mt-6 p-6 bg-blue-50 rounded-xl shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-3">🧠 NexaBiz AI Assistant</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ask about sales trends, demand predictions, or supply insights.
          </p>

          {/* Query Input */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Example: Analyze sales trends for the past 2 weeks"
              className="border border-blue-300 focus:ring-2 focus:ring-blue-500 p-2 w-full rounded-md"
              onKeyDown={e => e.key === 'Enter' && handleForecast()}
            />
            <button
              onClick={handleForecast}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition flex items-center justify-center"
              title="Ask NexaBiz AI"
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M12 2a10 10 0 100 20 10 10 0 000-20z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Messages Display */}
          <div className="mt-2 p-4 bg-gray-100 rounded-xl max-h-96 overflow-y-auto flex flex-col space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-blue-200 self-end'
                    : 'bg-white self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white p-2 rounded shadow-sm italic text-gray-600">
                NexaBiz AI is thinking...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
