'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaInbox, FaPaperPlane, FaEnvelope, FaBell } from 'react-icons/fa'
import InboxPage from './InboxPage'
import SentPage from './SentPage'

export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  const tabs = [
    {
      id: 'inbox' as const,
      label: 'Inbox',
      icon: FaInbox,
      color: 'blue',
      description: 'Received messages'
    },
    {
      id: 'sent' as const,
      label: 'Sent',
      icon: FaPaperPlane,
      color: 'green',
      description: 'Sent messages'
    }
  ]

  return (
    <div className="bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header Section - Not Sticky */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Title & Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FaEnvelope className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your email communications
                </p>
              </div>
            </div>

            {/* Notification Bell */}
            <button className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group">
              <FaBell className="text-xl text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                3
              </span>
            </button>
          </div>

          {/* Modern Tabs */}
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 shadow-inner">
            <div className="grid grid-cols-2 gap-1.5 relative">
              {/* Animated Background */}
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-y-1.5 rounded-xl shadow-md ${
                  activeTab === 'inbox'
                    ? 'bg-linear-to-br from-blue-500 to-indigo-600'
                    : 'bg-linear-to-br from-green-500 to-emerald-600'
                }`}
                initial={false}
                animate={{
                  x: activeTab === 'inbox' ? 0 : '100%',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
                style={{ width: 'calc(50% - 3px)' }}
              />

              {/* Tab Buttons */}
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative z-10 flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`text-lg ${isActive ? 'animate-pulse' : ''}`} />
                    <div className="flex flex-col items-start">
                      <span className="text-base md:text-lg">{tab.label}</span>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs opacity-90 hidden md:block"
                        >
                          {tab.description}
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaInbox className="text-blue-600 dark:text-blue-400 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Unread</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">12</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FaPaperPlane className="text-green-600 dark:text-green-400 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Sent Today</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">8</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FaEnvelope className="text-purple-600 dark:text-purple-400 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">234</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <FaBell className="text-orange-600 dark:text-orange-400 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">3</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'inbox' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'inbox' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'inbox' && <InboxPage />}
          {activeTab === 'sent' && <SentPage />}
        </motion.div>
      </div>

      {/* Floating Action Button (Compose) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 p-5 bg-linear-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 z-50 group"
        onClick={() => alert('Compose new email functionality coming soon!')}
      >
        <div className="relative">
          <FaEnvelope className="text-2xl" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Compose New Email
        </span>
      </motion.button>
    </div>
  )
}