'use client'

import { useState, useEffect } from 'react'
import { FaTrash, FaReply } from 'react-icons/fa'

interface Email {
  id: string
  from: string
  subject: string
  body: string
  date: string
  read: boolean
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Load dummy emails (replace with real Gmail later)
  useEffect(() => {
    setEmails([
      {
        id: '1',
        from: 'customer1@gmail.com',
        subject: 'Question about Jeans 19',
        body: 'Hi, can you tell me when Jeans 19 will be available?',
        date: '2025-10-21 10:30',
        read: false,
      },
      {
        id: '2',
        from: 'customer2@gmail.com',
        subject: 'Order status',
        body: 'Hello, I want to check the status of my last order.',
        date: '2025-10-20 14:15',
        read: true,
      },
    ])
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
    // Mark as read when expanded
    setEmails(prev =>
      prev.map(email =>
        email.id === id ? { ...email, read: true } : email
      )
    )
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return
    setEmails(prev => prev.filter(email => email.id !== id))
  }

  const handleReply = (email: Email) => {
    alert(`Reply to ${email.from} - Feature coming soon!`)
  }

  return (
    <div>
      {emails.length === 0 ? (
        <p className="text-gray-500">No emails in inbox.</p>
      ) : (
        <div className="space-y-4">
          {emails.map(email => (
            <div
              key={email.id}
              className={`rounded-lg shadow-md p-4 border-l-4 transition duration-300 cursor-pointer
                ${email.read ? 'border-gray-300 bg-gray-50' : 'border-blue-500 bg-white hover:shadow-lg'}
              `}
              onClick={() => handleToggleExpand(email.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{email.subject}</h3>
                  <p className="text-sm text-gray-600">From: {email.from}</p>
                </div>
                <span className="text-xs text-gray-400">{email.date}</span>
              </div>

              {expandedId === email.id && (
                <div className="mt-4 border-t pt-4 space-y-2 text-gray-700">
                  <p>{email.body}</p>

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleReply(email)
                      }}
                      className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      <FaReply /> Reply
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(email.id)
                      }}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
