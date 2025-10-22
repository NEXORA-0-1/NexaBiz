'use client'

import { useState, useEffect } from 'react'
import { FaTrash } from 'react-icons/fa'

interface SentEmail {
  id: string
  to: string
  subject: string
  body: string
  date: string
}

export default function SentPage() {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Load dummy sent emails (replace later with real Gmail API)
  useEffect(() => {
  const fetchSentEmails = async () => {
    try {
      const res = await fetch('/api/gmail?label=SENT')
      const data = await res.json()

      const mappedEmails: SentEmail[] = data.map((email: any) => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.date,
      }))

      setEmails(mappedEmails)
    } catch (error) {
      console.error('Error fetching sent emails:', error)
      setEmails([])
    }
  }

  fetchSentEmails()
}, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this sent email?')) return
    setEmails(prev => prev.filter(email => email.id !== id))
  }

  return (
    <div>
      {emails.length === 0 ? (
        <p className="text-gray-500">No sent emails.</p>
      ) : (
        <div className="space-y-4">
          {emails.map(email => (
            <div
              key={email.id}
              className="rounded-lg shadow-md p-4 border-l-4 border-green-500 bg-white cursor-pointer transition duration-300 hover:shadow-lg"
              onClick={() => handleToggleExpand(email.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{email.subject}</h3>
                  <p className="text-sm text-gray-600">To: {email.to}</p>
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
