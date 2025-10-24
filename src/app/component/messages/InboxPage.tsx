'use client'

import { useState, useEffect } from 'react'
import { FaTrash } from 'react-icons/fa'
import { getAuth } from "firebase/auth";

async function getAuthToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? await user.getIdToken() : null;
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

  // Fetch emails from backend API
  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gmail?label=INBOX')
      const data = await res.json()

      // Map backend email data to Email type
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

  // === Generate AI Reply ===
  const handleAIReply = async (email: Email) => {
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:3001/api/ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,

        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.error) {
        alert("AI Error: " + data.error);
      } else {
        setAiReply(prev => ({ ...prev, [email.id]: data.reply }));
      }
    } catch (err) {
      console.error("AI reply fetch failed:", err);
      alert("Failed to generate AI reply");
    }
  };

  // === Send Reply via Gmail ===
  const handleSendReply = async (email: Email) => {
    const replyText = aiReply[email.id];
    if (!replyText) return alert("No AI reply generated!");

    try {
      const res = await fetch("http://localhost:3001/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.from,
          subject: "Re: " + email.subject,
          body: replyText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Reply sent successfully!");
        setAiReply(prev => ({ ...prev, [email.id]: "" })); // clear after sending
      } else {
        alert("❌ Failed to send: " + data.error);
      }
    } catch (err) {
      console.error("Send reply failed:", err);
      alert("Failed to send email");
    }
  };

  if (loading) return <p className="text-gray-500">Loading emails...</p>

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

                  {/* AI Suggested Reply Section */}
                  {aiReply[email.id] && (
                    <div className="mt-3 p-3 bg-gray-100 rounded-md border">
                      <h4 className="font-semibold text-sm mb-1 text-gray-700">
                        🤖 AI Suggested Reply:
                      </h4>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: aiReply[email.id] }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReply(email);
                        }}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Send Reply
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIReply(email);
                      }}
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      🤖 Generate Reply
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(email.id);
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