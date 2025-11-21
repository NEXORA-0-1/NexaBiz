'use client'

import { useState, useEffect } from 'react'
import { FaTrash, FaRobot, FaPaperPlane, FaEnvelope, FaEnvelopeOpen, FaSpinner, FaChevronDown, FaChevronUp, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'
import { getAuth } from "firebase/auth"
import { motion, AnimatePresence } from 'framer-motion'

async function getAuthToken() {
  const auth = getAuth()
  const user = auth.currentUser
  return user ? await user.getIdToken() : null
}

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
  const [aiReply, setAiReply] = useState<{ [id: string]: string }>({})
  const [generatingReply, setGeneratingReply] = useState<{ [id: string]: boolean }>({})
  const [sendingReply, setSendingReply] = useState<{ [id: string]: boolean }>({})
  const [editingReply, setEditingReply] = useState<{ [id: string]: boolean }>({})
  const [editedReply, setEditedReply] = useState<{ [id: string]: string }>({})
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

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

  const handleAIReply = async (email: Email) => {
    setGeneratingReply(prev => ({ ...prev, [email.id]: true }))
    try {
      const token = await getAuthToken()
      const res = await fetch("http://localhost:3001/api/ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (data.error) {
        alert("AI Error: " + data.error)
      } else {
        setAiReply(prev => ({ ...prev, [email.id]: data.reply }))
        setEditedReply(prev => ({ ...prev, [email.id]: data.reply }))
      }
    } catch (err) {
      console.error("AI reply fetch failed:", err)
      alert("Failed to generate AI reply")
    } finally {
      setGeneratingReply(prev => ({ ...prev, [email.id]: false }))
    }
  }

  const handleSendReply = async (email: Email) => {
    const replyText = editedReply[email.id] || aiReply[email.id]
    if (!replyText) return alert("No reply to send!")

    setSendingReply(prev => ({ ...prev, [email.id]: true }))
    try {
      const res = await fetch("http://localhost:3001/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.from,
          subject: "Re: " + email.subject,
          body: replyText,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setAiReply(prev => ({ ...prev, [email.id]: "" }))
        setEditedReply(prev => ({ ...prev, [email.id]: "" }))
        setEditingReply(prev => ({ ...prev, [email.id]: false }))
        // Show success animation
        setTimeout(() => setExpandedId(null), 1000)
      } else {
        alert("❌ Failed to send: " + data.error)
      }
    } catch (err) {
      console.error("Send reply failed:", err)
      alert("Failed to send email")
    } finally {
      setSendingReply(prev => ({ ...prev, [email.id]: false }))
    }
  }

  const toggleEditReply = (id: string) => {
    setEditingReply(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread') return !email.read
    if (filter === 'read') return email.read
    return true
  })

  const unreadCount = emails.filter(e => !e.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500 dark:text-blue-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Inbox
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {emails.length} total emails
            </span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white text-xs font-semibold rounded-full"
              >
                {unreadCount} unread
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
          >
            <FaEnvelope className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No emails found</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className={`group relative rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden
                    ${email.read 
                      ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700' 
                      : 'bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 border-2 border-blue-500 dark:border-blue-400'
                    }
                  `}
                >
                  {/* Unread indicator */}
                  {!email.read && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-500"
                    />
                  )}

                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => handleToggleExpand(email.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className={`mt-1 p-3 rounded-xl transition-colors ${
                          email.read 
                            ? 'bg-gray-100 dark:bg-gray-700' 
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          {email.read ? (
                            <FaEnvelopeOpen className="text-gray-600 dark:text-gray-400" />
                          ) : (
                            <FaEnvelope className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
                            {email.subject}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            From: {email.from}
                          </p>
                          {expandedId !== email.id && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                              {email.body}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date & Expand Icon */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {email.date}
                        </span>
                        <motion.div
                          animate={{ rotate: expandedId === email.id ? 180 : 0 }}
                          className="text-gray-400 dark:text-gray-500"
                        >
                          <FaChevronDown />
                        </motion.div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedId === email.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                        >
                          {/* Email Body */}
                          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {email.body}
                            </p>
                          </div>

                          {/* AI Reply Section */}
                          <AnimatePresence>
                            {aiReply[email.id] && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-5 bg-linear-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-xl border border-purple-200 dark:border-purple-900"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaRobot className="text-purple-600 dark:text-purple-400" />
                                    AI Suggested Reply
                                  </h4>
                                  {!editingReply[email.id] ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleEditReply(email.id)
                                      }}
                                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      <FaEdit /> Edit
                                    </button>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleEditReply(email.id)
                                        }}
                                        className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                      >
                                        <FaCheck />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditedReply(prev => ({ ...prev, [email.id]: aiReply[email.id] }))
                                          toggleEditReply(email.id)
                                        }}
                                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {editingReply[email.id] ? (
                                  <textarea
                                    value={editedReply[email.id] || aiReply[email.id]}
                                    onChange={(e) => setEditedReply(prev => ({ ...prev, [email.id]: e.target.value }))}
                                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none transition-all"
                                    rows={6}
                                  />
                                ) : (
                                  <div
                                    className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: editedReply[email.id] || aiReply[email.id] }}
                                  />
                                )}

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendReply(email)
                                  }}
                                  disabled={sendingReply[email.id]}
                                  className="mt-4 flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                  {sendingReply[email.id] ? (
                                    <>
                                      <FaSpinner className="animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <FaPaperPlane />
                                      Send Reply
                                    </>
                                  )}
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAIReply(email)
                              }}
                              disabled={generatingReply[email.id]}
                              className="flex items-center gap-2 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {generatingReply[email.id] ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FaRobot />
                                  Generate AI Reply
                                </>
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(email.id)
                              }}
                              className="flex items-center gap-2 bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <FaTrash />
                              Delete
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}