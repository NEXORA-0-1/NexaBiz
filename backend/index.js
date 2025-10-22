const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

dotenv.config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- AUTH MIDDLEWARE --------------------
const authenticate = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// -------------------- FORECAST ROUTE --------------------
app.post('/api/forecast', authenticate, [
  body('query').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { query } = req.body;
  const userId = req.user.uid;
  console.log('Received query:', query, 'User ID:', userId);

  try {
    // --- Fetch stock data from products collection ---
    const productsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('products')
      .get();

    const stock_data = productsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        product_name: data.product_name || 'Unknown',
        qty: Number(data.stock_amount || 0),
        base_cost_usd: Number(data.base_cost_usd || 0),
        suggested_price_usd: Number(data.suggested_price_usd || 0),
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
      };
    });

    console.log("✅ Final stock_data being sent to AI:", JSON.stringify(stock_data, null, 2));

    // --- Fetch transaction data ---
    const transactionsSnap = await db.collection('users').doc(userId).collection('transactions').get();
    const transaction_data = transactionsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        createdAt: data.createdAt?.toDate().toISOString(),
        tid: data.tid || null,
        cus_name: data.cus_name || "Unknown",
        items: (data.items || []).map(item => ({
          product_name: item.product_name || 'Unknown',
          qty: Number(item.qty || 0),
          selling_price: Number(item.selling_price || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
        }))
      };
    });

    console.log("✅ Transaction data being sent to AI:", JSON.stringify(transaction_data, null, 2));

    // --- Call Python AI Agent ---
    const agentResponse = await axios.post('http://127.0.0.1:5001/ai', {
      query,
      stock_data,
      transaction_data
    });

    console.log("✅ AI agent response received");

    res.json(agentResponse.data);
  } catch (error) {
    console.error('❌ AI agent error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================================
// NEW SECTION — FIND CONTACTS API
// ========================================================

// Helper functions
const delay = ms => new Promise(res => setTimeout(res, ms));

const emailRe = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const phoneRe = /((?:\+94|0)?\s?\d{2,3}[-\s]?\d{3}[-\s]?\d{3,4}|\+?\d{7,15})/g;

async function ddgSearchFirstUrl(query) {
  const url = 'https://html.duckduckgo.com/html?q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();
  const $ = cheerio.load(text);
  const link = $('a.result__a').first().attr('href');
  return link || null;
}

async function fetchAndExtract(url) {
  if (!url) return { emails: [], phones: [] };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    const text = await res.text();
    const $ = cheerio.load(text);
    const bodyText = $('body').text();

    const emails = [
      ...new Set([
        ...(bodyText.match(emailRe) || []),
        ...$('a[href^="mailto:"]').map((i, el) => $(el).attr('href').replace(/^mailto:/i, '').trim()).get(),
      ])
    ];

    const phones = [
      ...new Set([
        ...(bodyText.match(phoneRe) || []),
        ...$('a[href^="tel:"]').map((i, el) => $(el).attr('href').replace(/^tel:/i, '').trim()).get(),
      ])
    ];

    return { emails, phones };
  } catch (err) {
    console.warn('Fetch error:', url, err.message);
    return { emails: [], phones: [] };
  }
}

// -------------------- FIND CONTACTS ROUTE --------------------
app.get('/api/findContacts', async (req, res) => {
  try {
    const names = [
      'NOLIMIT Glitz Colombo',
      'Malaka Trade Center Wellawatte Colombo',
      // Add more if needed
    ];

    const results = [];
    for (const name of names) {
      console.log('🔍 Searching:', name);
      const firstUrl = await ddgSearchFirstUrl(name + ' contact phone email Sri Lanka');
      console.log('🌐 Found URL:', firstUrl);
      const contact = await fetchAndExtract(firstUrl);
      results.push({ name, url: firstUrl, emails: contact.emails, phones: contact.phones });
      await delay(1500);
    }

    const filtered = results.filter(r => r.emails.length > 0 || r.phones.length > 0);
    res.json(filtered);
  } catch (err) {
    console.error('❌ FindContacts Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================================

app.listen(process.env.PORT || 3001, () =>
  console.log(`Backend running on port ${process.env.PORT || 3001}`)
);

// -------------------- AI AUTO-REPLY ROUTE --------------------
app.post('/api/ai-reply', authenticate, async (req, res) => {
  const { email } = req.body; // { from, subject, body }
  if (!email || !email.body) {
    return res.status(400).json({ error: 'Missing email data' });
  }

  const userId = req.user.uid;

  try {
    // --- Fetch data from Firestore ---
    const productsSnap = await db.collection('users').doc(userId).collection('products').get();
    const stock_data = productsSnap.docs.map(doc => doc.data());

    const transactionsSnap = await db.collection('users').doc(userId).collection('transactions').get();
    const transaction_data = transactionsSnap.docs.map(doc => doc.data());

    // --- Send to Python AI ---
    const aiResponse = await axios.post('http://127.0.0.1:5005/auto_reply', {
      email,
      stock_data,
      transaction_data
    });

    return res.json({ reply: aiResponse.data.reply });
  } catch (err) {
    console.error('AI Reply Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
