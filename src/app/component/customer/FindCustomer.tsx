'use client'

import { useState } from 'react'

export default function FindCustomer() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleSearch = async () => {
  setLoading(true)
  setError('')
  try {
    // ✅ Correct API endpoint
    const res = await fetch('/api/findcustomers')
    if (!res.ok) throw new Error('API request failed')
    const data = await res.json()
    setCustomers(data)
  } catch (err: any) {
    console.error(err)
    setError(err.message || 'Something went wrong')
  }
  setLoading(false)
}


  return (
    <div className="bg-white shadow p-6 rounded-md">
      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        🔍 Find Clothing Stores in Sri Lanka
      </button>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      <div className="mt-4 space-y-3">
        {customers.map((customer, i) => (
          <div key={i} className="border p-4 rounded hover:shadow transition">
            <h2 className="text-lg font-semibold">{customer.name}</h2>
            <p className="text-gray-600">{customer.type}</p>
            <p className="text-gray-500">{customer.city}</p>
            {customer.contact && (
              <p className="text-sm">
                <strong>Email:</strong> {customer.contact}
              </p>
            )}
            {customer.website && (
              <a
                href={customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Website
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
