'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Send, Mail, Bell, Plus, TrendingUp } from 'lucide-react'
import InboxPage from './InboxPage'
import SentPage from './SentPage'

export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your email communications</p>
        </div>
        
        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-3 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 group"
        >
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
            3
          </span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Unread</p>
              <p className="text-2xl font-black text-white">12</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Sent Today</p>
              <p className="text-2xl font-black text-white">8</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-pink-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Total</p>
              <p className="text-2xl font-black text-white">234</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Pending</p>
              <p className="text-2xl font-black text-white">3</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`
            relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${activeTab === 'inbox'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Inbox
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('sent')}
          className={`
            relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${activeTab === 'sent'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent
          </span>
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
            transition={{ duration: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Inbox Messages</h2>
              <p className="text-sm text-slate-500">Your received messages</p>
            </div>

            <InboxPage />
          </motion.div>
        )}

        {activeTab === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/10 rounded-xl p-6 shadow-xl"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Sent Messages</h2>
              <p className="text-sm text-slate-500">Messages you've sent</p>
            </div>

            <SentPage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Compose) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-full transition-all duration-300 z-50 group"
        onClick={() => alert('Compose new email functionality coming soon!')}
      >
        <div className="relative">
          <Plus className="w-6 h-6" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 text-white text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Compose New Email
        </span>
      </motion.button>
    </div>
  )
}