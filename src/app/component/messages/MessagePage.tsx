'use client'

import { useState, useEffect } from 'react'

export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [refresh, setRefresh] = useState(false)

  // State for emails
  const [inboxEmails, setInboxEmails] = useState<
    { from: string; subject: string; body: string; date: string }[]
  >([])
  const [sentEmails, setSentEmails] = useState<
    { to: string; subject: string; body: string; date: string }[]
  >([])

  // Toggle refresh (useful later when we fetch real emails)
  const handleRefresh = () => setRefresh(!refresh)

  // Load dummy emails
  useEffect(() => {
    // Dummy inbox emails
    setInboxEmails([
      {
        from: 'customer1@gmail.com',
        subject: 'Question about Jeans 19',
        body: 'Hi, can you tell me when Jeans 19 will be available?',
        date: '2025-10-21 10:30',
      },
      {
        from: 'customer2@gmail.com',
        subject: 'Order status',
        body: 'Hello, I want to check the status of my last order.',
        date: '2025-10-20 14:15',
      },
    ])

    // Dummy sent emails
    setSentEmails([
      {
        to: 'customer1@gmail.com',
        subject: 'Re: Question about Jeans 19',
        body: 'Hi, the Jeans 19 will be back in stock next week.',
        date: '2025-10-21 11:00',
      },
    ])
  }, [refresh])

  return (
    <div className="p-6">
      {/* -------- Tabs Header -------- */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'inbox'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-2 px-4 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'sent'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
        >
          Sent
        </button>
        <button
          onClick={handleRefresh}
          className="ml-auto bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
        >
          Refresh
        </button>
      </div>

      {/* -------- Tabs Content -------- */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {inboxEmails.length === 0 ? (
            <p className="text-gray-500">No emails in inbox.</p>
          ) : (
            inboxEmails.map((email, idx) => (
              <div
                key={idx}
                className="border p-4 rounded shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold">From: {email.from}</p>
                <p className="font-semibold">Subject: {email.subject}</p>
                <p className="text-gray-700 mt-1">{email.body}</p>
                <p className="text-sm text-gray-400 mt-1">{email.date}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentEmails.length === 0 ? (
            <p className="text-gray-500">No sent emails.</p>
          ) : (
            sentEmails.map((email, idx) => (
              <div
                key={idx}
                className="border p-4 rounded shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold">To: {email.to}</p>
                <p className="font-semibold">Subject: {email.subject}</p>
                <p className="text-gray-700 mt-1">{email.body}</p>
                <p className="text-sm text-gray-400 mt-1">{email.date}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
