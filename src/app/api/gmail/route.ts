import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'
import { sanitizeHTML } from '@/lib/sanitizeHtml'  // ✅ sanitize before sending to client

const tokenPath = path.join(process.cwd(), 'backend/token.json')
const credentialsPath = path.join(process.cwd(), 'backend/gmailOAuth.json')

// Helper function to decode Gmail base64url body
function decodeBase64(body: string): string {
  return Buffer.from(body, 'base64').toString('utf-8')
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const label = url.searchParams.get('label') || 'INBOX'

    // --- Load OAuth credentials ---
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
    const { client_secret, client_id, redirect_uris } = credentials.web

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    )

    // --- Load access token ---
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
    oAuth2Client.setCredentials(token)

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    // --- Fetch message list ---
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [label],
      maxResults: 10,
    })

    if (!res.data.messages || res.data.messages.length === 0) {
      return NextResponse.json([])
    }

    // --- Fetch full message details ---
    const messages = await Promise.all(
      res.data.messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
        })

        const headers = detail.data.payload?.headers || []
        let body = ''

        const parts = detail.data.payload?.parts || []

        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            const decoded = decodeBase64(part.body.data)
            body = sanitizeHTML(decoded) // ✅ sanitize HTML
            break
          }
          if (part.mimeType === 'text/plain' && part.body?.data && !body) {
            const decoded = decodeBase64(part.body.data)
            body = sanitizeHTML(decoded) // ✅ fallback plain text
          }
        }

        // --- Extract metadata ---
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown'
        const to = headers.find((h) => h.name === 'To')?.value || 'Unknown'
        const subject =
          headers.find((h) => h.name === 'Subject')?.value || 'No Subject'
        const date = headers.find((h) => h.name === 'Date')?.value || ''

        return { id: msg.id, from, to, subject, body, date }
      })
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Gmail fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Gmail messages' },
      { status: 500 }
    )
  }
}
