import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const credentialsPath = path.join(process.cwd(), "backend/gmailOAuth.json");
  const tokenPath = path.join(process.cwd(), "backend/token.json");
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));

  return NextResponse.json({ message: "Authentication successful! You can close this window." });
}
