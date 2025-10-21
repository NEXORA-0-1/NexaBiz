'use client'

import { useState } from 'react'

export default function FindCustomer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [customer, setCustomer] = useState<any>(null)

  const handleSearch = () => {
    // Example fetch logic – replace with your API
    // fetch(`/api/customers?name=${searchTerm}`)
    //   .then(res => res.json())
    //   .then(data => setCustomer(data))

    // Temporary mock
    setCustomer({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
    })
  }

  return (
    <div className="bg-white shadow p-6 rounded-md">
      <div className="flex items-center space-x-3 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter customer name or ID"
          className="border px-4 py-2 rounded w-full"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {customer ? (
        <div className="mt-4 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
        </div>
      ) : (
        <p className="text-gray-500">No customer found.</p>
      )}
    </div>
  )
}
