// components/Home.tsx

import React, { useState } from 'react'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'

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

  const toggleProfile = () => setShowProfile(prev => !prev)

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
        <p className="text-xl mb-4">Welcome back, <span className="font-semibold">{userData.name}</span> 👋</p>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
            <p className="text-2xl font-bold">157</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
