export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  const { id } = await req.json();

  const credentials = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "backend/gmailOAuth.json"), "utf-8")
  );
  const token = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "backend/token.json"), "utf-8")
  );

  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.setCredentials(token);

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id,
      resource: {
        removeLabelIds: ["UNREAD"],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
