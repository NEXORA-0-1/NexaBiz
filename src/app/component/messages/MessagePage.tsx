'use client'

import { useState } from 'react'
import InboxPage from './InboxPage'
import SentPage from './SentPage'

export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  return (
    <div className="p-6">
      {/* Tabs Header */}
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
      </div>

      {/* Tabs Content */}
      {activeTab === 'inbox' && <InboxPage />}
      {activeTab === 'sent' && <SentPage />}
    </div>
  )
}
