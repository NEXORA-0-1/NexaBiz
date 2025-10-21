const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

dotenv.config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
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

app.post('/api/forecast', authenticate, [
  body('query').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { query } = req.body;
  const userId = req.user.uid;
  console.log('Received query:', query, 'User ID:', userId); // debug

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

    res.json(agentResponse.data);
  } catch (error) {
    console.error('❌ AI agent error:', error.message); // debug
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => console.log(`Backend on port ${process.env.PORT || 3001}`));
