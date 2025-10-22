import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

const tokenPath = path.join(process.cwd(), 'backend/token.json')
const credentialsPath = path.join(process.cwd(), 'backend/gmailOAuth.json')

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const label = url.searchParams.get('label') || 'INBOX'

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
    const { client_secret, client_id, redirect_uris } = credentials.web

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
    oAuth2Client.setCredentials(token)

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [label],
      maxResults: 10,
    })

    const messages = await Promise.all(
      (res.data.messages || []).map(async (msg) => {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id })
        const snippet = detail.data.snippet
        const headers = detail.data.payload?.headers || []
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown'
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject'
        return { id: msg.id, from, subject, snippet }
      })
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Gmail fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch Gmail messages' }, { status: 500 })
  }
}
