// components/Home.tsx
'use client'

import React, { useState } from 'react'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'
import { auth } from "@/lib/firebase";

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

const Home: React.FC<HomeProps> = ({ userData }) => {
  const [showProfile, setShowProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)

  const toggleProfile = () => setShowProfile(prev => !prev)

  const handleForecast = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken()
      console.log('Sending query:', query); // Debug: Log query
      const response = await fetch('http://localhost:3001/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ query })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Forecast error:', error)
      setResult({ error: 'Failed to fetch forecast' })
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-blue-900 p-8">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Profile Icon */}
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
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white text-blue-900 rounded-xl shadow-lg p-4 z-50"
            >
              <h4 className="text-lg font-semibold mb-2">User Info</h4>
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Role:</strong> {userData.role || 'user'}</p>
              <p><strong>Approved:</strong> {userData.approved ? 'Yes' : 'No'}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8">

        {/* Welcome Message */}
        <p className="text-xl mb-4">
          Welcome back, <span className="font-semibold">{userData.name}</span> 👋
        </p>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
            <p className="text-2xl font-bold">$12,340</p>
          </div>
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
            <p className="text-2xl font-bold">$3,210</p>
          </div>
          <div className="p-6 bg-blue-100 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-2">Orders</h3>
            <p className="text-2xl font-bold">201</p>
          </div>
        </div>

        {/* Nexabiz AI Section */}
        <div className="mt-6 p-6 bg-blue-50 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Nexabiz AI</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask me about product demand, orders, or stock"
              className="border p-2 w-full rounded"
              onKeyDown={e => e.key === 'Enter' && handleForecast()} // Press Enter to send
            />
            <button
              onClick={handleForecast}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
              title="Ask Nexabiz AI"
            >
              {/* Symbol like ChatGPT icon (using SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            </button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded max-h-80 overflow-y-auto">
              <h3 className="font-medium mb-2">Response:</h3>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Home
