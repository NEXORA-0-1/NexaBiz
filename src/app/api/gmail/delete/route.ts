export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

const tokenPath = path.join(process.cwd(), 'backend/token.json')
const credentialsPath = path.join(process.cwd(), 'backend/gmailOAuth.json')

export async function POST(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
    const { client_secret, client_id, redirect_uris } = credentials.web

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    )

    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
    oAuth2Client.setCredentials(token)

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    // ✅ MOVE TO TRASH (NOT HARD DELETE)
    await gmail.users.messages.trash({
      userId: 'me',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Gmail trash error:', error?.response?.data || error)
    return NextResponse.json(
      { error: error?.message || 'Failed to trash email' },
      { status: 500 }
    )
  }
}
