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

// ✅ Firebase Auth Middleware
const authenticate = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ✅ Forecast + Optimizer Endpoint
app.post('/api/forecast', authenticate, [
  body('query').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { query } = req.body;
  const userId = req.user.uid;

  try {
    // 🔹 Fetch stock data from Firestore
    const productsSnap = await db.collection('users').doc(userId).collection('products').get();
    const stock_data = productsSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      qty: Number(doc.data().qty || 0),
      purchase_price: Number(doc.data().purchase_price || 0)
    }));

    // 🔹 Fetch transaction data
    const transactionsSnap = await db.collection('users').doc(userId).collection('transactions').get();
    const transaction_data = transactionsSnap.docs.flatMap(doc => {
      const items = doc.data().items || [];
      return items.map(item => ({
        product_name: item.product_name,
        qty: Number(item.qty || 0),
        date: doc.data().createdAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
      }));
    });

    // ✅ Step 1: Call Demand Predictor Agent
    const demandResponse = await axios.post('http://127.0.0.1:5000/predict_demand', {
      query,
      stock_data,
      transaction_data
    }, { timeout: 10000, validateStatus: status => status < 500 });

    if (demandResponse.status >= 400) {
      console.error('Demand Predictor error:', demandResponse.data);
      return res.status(demandResponse.status).json({ demand: { error: "Demand predictor failed" } });
    }

    // ✅ Step 2: Call Order Optimizer Agent (new API structure from order_optimizer.py)
    const optimizerResponse = await axios.post('http://127.0.0.1:5001/optimize_order', {
      query,
      stock_data,
      transaction_data,
      forecast_data: demandResponse.data   // 🔹 Pass forecast result here
    }, { timeout: 10000, validateStatus: status => status < 500 });

    if (optimizerResponse.status >= 400) {
      console.error('Order Optimizer error:', optimizerResponse.data);
      return res.status(optimizerResponse.status).json({ order: { error: "Order optimizer failed" } });
    }

    // ✅ Step 3: Combine both responses cleanly
    res.json({
      demand: demandResponse.data,
      order: optimizerResponse.data
    });

  } catch (error) {
    console.error('Backend error:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ✅ Server Startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
