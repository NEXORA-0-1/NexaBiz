'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Send, Mail, Bell, Plus, TrendingUp } from 'lucide-react'
import InboxPage from './InboxPage'
import SentPage from './SentPage'

/* =======================
   Email Type
======================= */
interface Email {
  id: string
  from: string
  subject: string
  body: string
  date: string
  read: boolean
}

interface SentEmail {
  id: string
  to: string
  subject: string
  body: string
  date: string
}
export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  /* =======================
     NEW STATES (ADDED)
  ======================= */
  const [inboxEmails, setInboxEmails] = useState<Email[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])

  /* =======================
     STATS CALCULATION (ADDED)
  ======================= */
  const unreadCount = inboxEmails.filter(e => !e.read).length
  const totalCount = inboxEmails.length + sentEmails.length

  const today = new Date().toDateString()
  const sentTodayCount = sentEmails.filter(
    e => new Date(e.date).toDateString() === today
  ).length

  const pendingCount = inboxEmails.filter(e => e.read).length

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your email communications
          </p>
        </div>

        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 group"
        >
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount}
          </span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Unread */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Unread</p>
              <p className="text-2xl font-black text-white">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>

        {/* Sent Today */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">
                Sent Today
              </p>
              <p className="text-2xl font-black text-white">
                {sentTodayCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-pink-400" />
            </div>
          </div>
        </motion.div>

        {/* Total */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Total</p>
              <p className="text-2xl font-black text-white">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Pending */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Pending</p>
              <p className="text-2xl font-black text-white">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'inbox'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white'
              : 'text-slate-400'
          }`}
        >
          <Inbox className="w-4 h-4 inline mr-2" />
          Inbox
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'sent'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white'
              : 'text-slate-400'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Sent
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6"
          >
            <InboxPage onEmailsLoaded={setInboxEmails} />
          </motion.div>
        )}

        {activeTab === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6"
          >
            <SentPage onEmailsLoaded={setSentEmails} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white rounded-full"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
