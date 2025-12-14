export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

export async function GET() {
  const credentialsPath = path.join(process.cwd(), "backend/gmailOAuth.json");
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
    ],
  });

  return NextResponse.redirect(authUrl);
}
