'use client'

import { useState, useEffect } from 'react';

export default function SupplierReplies() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supplier-replies', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // if using Firebase ID token
      }
    })
      .then(res => res.json())
      .then(data => {
        setReplies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading replies...</p>;

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Supplier Replies</h2>
      {replies.length === 0 ? (
        <p>No replies received yet.</p>
      ) : (
        <ul className="space-y-4">
          {replies.map(reply => (
            <li key={reply.id} className="p-4 border rounded shadow-sm bg-white">
              <p><strong>From:</strong> {reply.from}</p>
              <p><strong>Subject:</strong> {reply.subject}</p>
              <p><strong>Body:</strong> <span dangerouslySetInnerHTML={{ __html: reply.body }} /></p>
              <p><strong>Received:</strong> {new Date(reply.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
