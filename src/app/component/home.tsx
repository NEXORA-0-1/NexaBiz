// components/Home.tsx

import React from 'react'

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
  return (
    <div className="bg-gray-600 text-white p-6 rounded">
      <h2 className="text-xl font-semibold mb-4">Home</h2>
      <p className="mb-4">Welcome, {userData.name}!</p>

      <div className="space-y-2">
        <p><strong>User ID:</strong> {userData.userId}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role || 'user'}</p>
        <p><strong>Approved:</strong> {userData.approved ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}

export default Home
