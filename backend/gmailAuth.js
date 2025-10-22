import { google } from "googleapis";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const credentialsPath = path.join(process.cwd(), "backend/gmailOAuth.json");
const tokenPath = path.join(process.cwd(), "backend/token.json");

// Step 1: Load credentials
function loadCredentials() {
  const content = fs.readFileSync(credentialsPath);
  return JSON.parse(content);
}

// Step 2: Create OAuth client
function createOAuthClient() {
  const { client_secret, client_id, redirect_uris } = loadCredentials().web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// Step 3: Get auth URL
export function getAuthUrl() {
  const oAuth2Client = createOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
}

// Step 4: Get token from code
export async function getToken(code) {
  const oAuth2Client = createOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  return tokens;
}

// Step 5: Load saved token
export function getSavedAuth() {
  const oAuth2Client = createOAuthClient();
  const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}
