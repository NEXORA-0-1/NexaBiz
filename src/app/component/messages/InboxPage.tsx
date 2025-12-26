'use client'
import { useState, useEffect } from 'react'
import { Trash2, Bot, Send, Mail, MailOpen, Loader2, ChevronDown, Edit, Check, X, Sparkles } from 'lucide-react'
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

export default function InboxPage({
  onEmailsLoaded,
}: {
  onEmailsLoaded: (emails: Email[]) => void
}) {
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
        read: email.read ?? false,
      }))
      setEmails(mappedEmails)
      onEmailsLoaded(mappedEmails) 
    } catch (err) {
      console.error('Error fetching emails:', err)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
    const interval = setInterval(() => {
      fetchEmails()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleExpand = async (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
    const email = emails.find(e => e.id === id)
    if (!email || email.read) return

    try {
      const res = await fetch("/api/gmail/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) {
        setEmails(prev => {
          const updated = prev.map(e =>
            e.id === id ? { ...e, read: true } : e
          )
          onEmailsLoaded(updated) // ✅ sync stats
          return updated
        })
      } else {
        console.error("Failed to mark read:", data.error)
      }
    } catch (err) {
      console.error("Error marking email read:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return
    try {
      const res = await fetch('/api/gmail/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!data.success) {
        alert('Failed to delete email')
        return
      }
      setEmails(prev => {
        const updated = prev.filter(email => email.id !== id)
        onEmailsLoaded(updated) // ✅ sync stats
        return updated
      })
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete email')
    }
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
        setTimeout(() => setExpandedId(null), 1000)
      } else {
        alert("Failed to send: " + data.error)
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
          <Loader2 className="w-10 h-10 text-purple-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              relative px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm
              ${filter === f
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Mail className="w-10 h-10 text-purple-400" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No emails found</p>
          <p className="text-slate-500 text-sm mt-1">Your inbox is empty</p>
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
                transition={{ delay: index * 0.03 }}
                layout
                className="group relative bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden"
              >
                {/* Unread indicator */}
                {!email.read && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                )}
                
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => handleToggleExpand(email.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`mt-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        email.read 
                          ? 'bg-slate-800/50 border border-slate-700/50' 
                          : 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 border border-purple-500/30'
                      }`}>
                        {email.read ? (
                          <MailOpen className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Mail className="w-5 h-5 text-purple-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base mb-1 truncate ${
                          email.read ? 'text-slate-300' : 'text-white'
                        }`}>
                          {email.subject}
                        </h3>
                        <p className="text-sm text-slate-400 truncate mb-2">
                          From: {email.from}
                        </p>
                        {expandedId !== email.id && (
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {email.body}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date & Expand Icon */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {email.date}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedId === email.id ? 180 : 0 }}
                        className="text-slate-400"
                      >
                        <ChevronDown className="w-4 h-4" />
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
                        className="mt-5 pt-5 border-t border-slate-800"
                      >
                        {/* Email Body */}
                        <div className="mb-5 p-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg">
                          <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
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
                              className="mb-5 p-5 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/30 rounded-xl"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                  AI Suggested Reply
                                </h4>
                                {!editingReply[email.id] ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleEditReply(email.id)
                                    }}
                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                  >
                                    <Edit className="w-3 h-3" /> Edit
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleEditReply(email.id)
                                      }}
                                      className="text-green-400 hover:text-green-300 transition-colors"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditedReply(prev => ({ ...prev, [email.id]: aiReply[email.id] }))
                                        toggleEditReply(email.id)
                                      }}
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {editingReply[email.id] ? (
                                <textarea
                                  value={editedReply[email.id] || aiReply[email.id]}
                                  onChange={(e) => setEditedReply(prev => ({ ...prev, [email.id]: e.target.value }))}
                                  className="w-full p-3 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                                  rows={6}
                                />
                              ) : (
                                <div
                                  className="text-slate-300 text-sm leading-relaxed"
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
                                className="mt-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:from-slate-700 disabled:to-slate-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-300"
                              >
                                {sendingReply[email.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
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
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-green-500/30 disabled:from-slate-700 disabled:to-slate-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm"
                          >
                            {generatingReply[email.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Bot className="w-4 h-4" />
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
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:shadow-lg hover:shadow-red-500/30 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
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
  )
}