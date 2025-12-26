'use client'

import { useState, useEffect } from 'react'
import { FaTrash, FaPaperPlane, FaSpinner, FaChevronDown, FaUser, FaClock, FaCheckCircle, FaRedo } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

interface SentEmail {
  id: string
  to: string
  subject: string
  body: string
  date: string
}

export default function SentPage({
  onEmailsLoaded,
}: {
  onEmailsLoaded: (emails: SentEmail[]) => void
}) {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deleting, setDeleting] = useState<{ [id: string]: boolean }>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchSentEmails = async () => {
      setLoading(true)
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
        onEmailsLoaded(mappedEmails)
      } catch (error) {
        console.error('Error fetching sent emails:', error)
        setEmails([])
      } finally {
        setLoading(false)
      }
    }

    fetchSentEmails()
  }, [])

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sent email?')) return
    
    setDeleting(prev => ({ ...prev, [id]: true }))
    
    // Simulate deletion delay for animation
    setTimeout(() => {
      setEmails(prev => prev.filter(email => email.id !== id))
      setDeleting(prev => ({ ...prev, [id]: false }))
    }, 300)
  }

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaSpinner className="text-4xl text-green-500 dark:text-green-400" />
          </motion.div>
        </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <FaPaperPlane className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Sent Mail
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {emails.length} sent {emails.length === 1 ? 'email' : 'emails'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search sent emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 pl-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-sm"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
          >
            <div className="mb-6">
              <div className="inline-block p-6 bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                <FaPaperPlane className="text-5xl text-green-500 dark:text-green-400" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {searchQuery ? 'No emails match your search' : 'No sent emails yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-green-600 dark:text-green-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className={`group relative rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                    deleting[email.id] ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {/* Success indicator bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 to-emerald-500" />

                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => handleToggleExpand(email.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="mt-1 p-3 rounded-xl bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                          <FaCheckCircle className="text-green-600 dark:text-green-400 text-lg" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 truncate">
                            {email.subject}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-xs" />
                              <span className="truncate max-w-xs">To: {email.to}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaClock className="text-xs" />
                              <span>{email.date}</span>
                            </div>
                          </div>

                          {expandedId !== email.id && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-3 line-clamp-2">
                              {email.body.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <motion.div
                        animate={{ rotate: expandedId === email.id ? 180 : 0 }}
                        className="text-gray-400 dark:text-gray-500 mt-2"
                      >
                        <FaChevronDown />
                      </motion.div>
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
                          <div className="mb-6">
                            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                              <div
                                className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none prose-sm"
                                dangerouslySetInnerHTML={{ __html: email.body }}
                              />
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                            <FaCheckCircle className="text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Successfully Delivered
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Add resend functionality here
                                alert('Resend functionality coming soon!')
                              }}
                              className="flex items-center gap-2 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <FaRedo />
                              Resend
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(email.id)
                              }}
                              disabled={deleting[email.id]}
                              className="flex items-center gap-2 bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {deleting[email.id] ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <FaTrash />
                                  Delete
                                </>
                              )}
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

        {/* Stats Footer */}
        {emails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {emails.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Sent
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  100%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Delivery Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {filteredEmails.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Matching' : 'Displayed'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}