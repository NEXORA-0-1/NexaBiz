'use client'

import { useState, useEffect } from 'react'
import { FaTrash, FaReply } from 'react-icons/fa'
import { sanitizeHTML } from '../../../../lib/sanitizeHtml'



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
  const [loading, setLoading] = useState<boolean>(true)
  const [replyTo, setReplyTo] = useState<Email | null>(null)
  const [replyBody, setReplyBody] = useState('')

  // Fetch emails from backend API
  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gmail?label=INBOX')
      const data = await res.json()

      const mappedEmails: Email[] = data.map((email: any) => ({
        id: email.id,
        from: email.from,
        subject: email.subject,
        body: email.body || 'No preview available',
        date: email.date,
        read: false,
      }))

      setEmails(mappedEmails)
    } catch (err) {
      console.error('Error fetching emails:', err)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
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
    setReplyTo(email)
  }

  const handleSendReply = async () => {
    if (!replyTo || !replyBody.trim()) return

    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyTo.from,
          subject: `Re: ${replyTo.subject}`,
          body: replyBody,
          threadId: replyTo.id,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✅ Reply sent successfully!')
        setReplyBody('')
        setReplyTo(null)
      } else {
        alert(`❌ Failed to send reply: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('❌ Failed to send reply')
    }
  }

  if (loading) return <p className="text-gray-500">Loading emails...</p>

  return (
    <div>
      {emails.length === 0 ? (
        <p className="text-gray-500">No emails in inbox.</p>
      ) : (
        <div className="space-y-4">
          {emails.map(email => {
            // ✅ Sanitize email body before rendering
            const safeBody = sanitizeHTML(email.body || '')

            return (
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
                    {/* ✅ Safely render sanitized HTML */}
                    <div dangerouslySetInnerHTML={{ __html: email.body }} />

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
            )
          })}
        </div>
      )}

      {/* ✅ Reply Modal */}
      {replyTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-2">
              Reply to: {replyTo.from}
            </h2>
            <textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              className="w-full border rounded p-2 mb-3"
              rows={5}
              placeholder="Type your reply..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={handleSendReply}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
