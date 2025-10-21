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
  console.log('Received query:', query, 'User ID:', userId); //debug

  try {
    // IR: Fetch stock data from products collection
    const productsSnap = await db.collection('users').doc(userId).collection('products').get();
    const stock_data = productsSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      qty: Number(doc.data().qty || 0)
    }));

    // IR: Fetch transaction data
    const transactionsSnap = await db.collection('users').doc(userId).collection('transactions').get();
    const transaction_data = transactionsSnap.docs.flatMap(doc => {
      const items = doc.data().items || [];
      return items.map(item => ({
        product_name: item.product_name,
        qty: Number(item.qty || 0),
        date: doc.data().createdAt?.toDate().toISOString().split('T')[0]  // Simplified date
      }));
    });

    // Call Python Agent
    const agentResponse = await axios.post('http://127.0.0.1:5001/ai', {
      query,
      stock_data,
      transaction_data
    });
    
    res.json(agentResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => console.log('Backend on port'+ (process.env.PORT || 3001)));

