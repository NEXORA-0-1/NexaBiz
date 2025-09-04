import spacy
from flask import Flask, request, jsonify
import pandas as pd
import logging
import os
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(filename='order_optimizer_logs.txt', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables (optional, no OpenAI used)
load_dotenv()

# Load NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"Error loading spaCy model: {e}")
    logging.error(f"Error loading spaCy model: {e}")
    exit(1)

app = Flask(__name__)

@app.route('/optimize_order', methods=['POST'])
def optimize_order():
    try:
        data = request.get_json()
        if not data:
            logging.error("No JSON data received")
            return jsonify({'error': 'No JSON data provided'}), 400

        query = data.get('query', '').strip()
        stock_data = data.get('stock_data', [])
        transaction_data = data.get('transaction_data', [])
        forecast_data = data.get('forecast_data', {})

        if not query or not stock_data or not transaction_data or not forecast_data:
            logging.error("Missing required fields")
            return jsonify({'error': 'Missing required fields: query, stock_data, transaction_data, or forecast_data'}), 400

        df_transactions = pd.DataFrame(transaction_data)
        df_stock = pd.DataFrame(stock_data)

        # Validate data formats to match demand_predictor.py
        if not all(item.get('name') and isinstance(item.get('qty'), (int, float)) for item in stock_data):
            logging.error("Invalid stock data format")
            return jsonify({'error': 'Invalid stock data format'}), 400
        if not all(item.get('product_name') and isinstance(item.get('qty'), (int, float)) and item.get('date') for item in transaction_data):
            logging.error("Invalid transaction data format")
            return jsonify({'error': 'Invalid transaction data format'}), 400

        # Determine product from query (match demand_predictor.py logic)
        query_lower = query.lower()
        product = None
        current_stock = 0
        purchase_price = 0

        for item in stock_data:
            if item['name'].lower() in query_lower:
                product = item['name']
                current_stock = item['qty']
                purchase_price = item.get('purchase_price', 0)  # Default to 0 if missing
                break

        if not product and stock_data:
            product = stock_data[0]['name']
            current_stock = stock_data[0]['qty']
            purchase_price = stock_data[0].get('purchase_price', 0)
        elif not product:
            logging.error("No products available in stock_data")
            return jsonify({'error': 'No products available'}), 400

        # Get forecast data
        forecast_demand = forecast_data.get('forecast_demand', 0)
        past_sales = forecast_data.get('past_sales', 0)

        # Filter transactions for this product
        product_transactions = df_transactions[df_transactions['product_name'].str.lower() == product.lower()]
        if product_transactions.empty:
            logging.error(f"No transactions found for {product}")
            return jsonify({'error': f'No transactions found for {product}'}), 400

        # Optimization logic
        if len(product_transactions) < 3:
            logging.warning(f'Insufficient records for {product}: {len(product_transactions)} records, using fallback')
            order_qty = max(10, forecast_demand - current_stock)  # Fallback: forecast - stock or min 10
            recommendation = f"Limited records for {product}. Order based on forecast."
        else:
            buffer = forecast_demand * 0.1  # 10% buffer
            order_qty = max(0, forecast_demand - current_stock + buffer)
            recommendation = f"Optimized order for {product} based on {len(product_transactions)} transactions."

        order_qty = round(order_qty)
        order_cost = order_qty * purchase_price

        logging.info(f"Query: {query}, Product: {product}, Stock: {current_stock}, Forecast: {forecast_demand}, Order: {order_qty}, Cost: {order_cost}, Recommendation: {recommendation}")

        return jsonify({
            'product': product,
            'current_stock': current_stock,
            'forecast_demand': float(forecast_demand),
            'order_quantity': order_qty,
            'order_cost': float(order_cost),
            'recommendation': recommendation
        })

    except Exception as e:
        logging.error(f"Error in /optimize_order: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server for Order Optimizer on port 5001...")
    try:
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        print(f"Error starting Flask server: {e}")
        logging.error(f"Flask server error: {e}")