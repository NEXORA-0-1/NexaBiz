import spacy
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)

@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        data = request.json
        query = data.get('query', '').strip()
        stock_data = data.get('stock_data', [])
        transaction_data = data.get('transaction_data', [])
        logging.info(f"Received: query={query}, stock_data={stock_data}, transaction_data={transaction_data}") # Debug

        if not query or not stock_data or not transaction_data:
            return jsonify({'error': 'Insufficient data'}), 400

        df_transactions = pd.DataFrame(transaction_data)
        df_stock = pd.DataFrame(stock_data)

        # --- Determine product from query using string matching ---
        query_lower = query.lower()
        product = None
        current_stock = 0

        for item in stock_data:
            if item['name'].lower() in query_lower:
                product = item['name']
                current_stock = item['qty']
                break

        # fallback to first product if no match
        if not product:
            product = stock_data[0]['name']
            current_stock = stock_data[0]['qty']

        # Determine period from query (fallback to 'month')
        doc = nlp(query)
        period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')

        # Filter transactions for this product
        product_transactions = df_transactions[df_transactions['product_name'].str.lower() == product.lower()]
        if product_transactions.empty:
            return jsonify({'error': f'No transactions found for {product}'}), 400

        # Prepare features for Linear Regression
        current_stock = df_stock[df_stock['name'] == product]['qty'].iloc[0] if product in df_stock['name'].values else 0
        product_sales = df_transactions[df_transactions['product_name'] == product]['qty'].sum() if not df_transactions.empty else 0
        total_sales = df_transactions['qty'].sum() if not df_transactions.empty else 1
        sales_ratio = product_sales / total_sales if total_sales > 0 else 0
        logging.info(f"Processed: product={product}, current_stock={current_stock}, product_sales={product_sales}") # Debug
        X = []
        y = []

        for tx in product_transactions.itertuples():
            sales_ratio = tx.qty / total_sales
            X.append([current_stock, sales_ratio])
            y.append(tx.qty)

        if len(X) < 2:
            logging.warning(f'Insufficient data for {product}: X={X}, y={y}')
            return jsonify({'error': 'Not enough data for prediction'}), 400

        # Train Linear Regression
        model = LinearRegression()
        model.fit(X, y)
        future_demand = model.predict([[current_stock * 0.9, sum([tx.qty for tx in product_transactions.itertuples()])/total_sales]])[0]
        future_demand = max(0, future_demand)

        # Dummy insight (bypass OpenAI)
        insight = f"Forecast for {product} based on recent sales trends."

        # Logging
        logging.info(f"Query: {query}, Product: {product}, Stock: {current_stock}, Sales: {sum(y)}, Forecast: {future_demand}, Insight: {insight}")

        return jsonify({
            'product': product,
            'period': period,
            'current_stock': current_stock,
            'past_sales': sum(y),
            'forecast_demand': float(future_demand),
            'insight': insight
        })

    except Exception as e:
        logging.error(f"Unhandled error in /predict_demand: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
