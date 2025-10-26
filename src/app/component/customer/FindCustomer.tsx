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
      // ✅ API endpoint (your backend route)
      const res = await fetch('/api/findcustomers')
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      setCustomers(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md p-6 rounded-xl">
      <button
        onClick={handleSearch}
        disabled={loading}
        className={`${
          loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-semibold px-5 py-2 rounded transition-all duration-200`}
      >
        🔍 Find Clothing Stores in Sri Lanka
      </button>

      {loading && (
        <p className="mt-4 text-gray-500 animate-pulse">
          Fetching clothing stores, please wait...
        </p>
      )}
      {error && (
        <p className="mt-4 text-red-500 font-medium bg-red-50 p-2 rounded">
          ⚠️ {error}
        </p>
      )}

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer, i) => (
          <div
            key={i}
            className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-50"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {customer.name}
            </h2>
            <p className="text-gray-600">{customer.type}</p>
            <p className="text-gray-500 mb-2">{customer.city}</p>

            {/* ✅ Show phone and email if available */}
            {customer.phone && (
              <p className="text-sm text-gray-700">
                📞 <strong>{customer.phone}</strong>
              </p>
            )}
            {customer.email && (
              <p className="text-sm text-gray-700">
                📧 <strong>{customer.email}</strong>
              </p>
            )}

            {/* ✅ Show website if available */}
            {customer.website && (
              <a
                href={customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        ))}

        {!loading && customers.length === 0 && !error && (
          <p className="text-gray-500 mt-6 col-span-full text-center">
            No clothing stores found yet. Click the button to search.
          </p>
        )}
      </div>
    </div>
  )
}
