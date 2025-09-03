import spacy
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
from openai import OpenAI
import logging
import os
from dotenv import load_dotenv
import numpy as np

load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")
client = OpenAI(api_key=openai_api_key)

logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logging.error(f"Failed to load spaCy model: {e}")
    raise

app = Flask(__name__)

@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        data = request.json
        query = data.get('query')
        stock_data = data.get('stock_data')
        transaction_data = data.get('transaction_data')
        logging.info(f"Received: query={query}, stock_data={stock_data}, transaction_data={transaction_data}")

        if not query or not stock_data or not transaction_data:
            logging.error("Missing query, stock_data, or transaction_data")
            return jsonify({'error': 'Missing required data'}), 400

        doc = nlp(query)
        product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), None)
        logging.info(f"Entities: {[(ent.text, ent.label_) for ent in doc.ents]}")
        if not product:
            # Fallback: Extract product from query
            product = query.lower().replace('predict demand for', '').replace('next month', '').strip()
            logging.info(f"Fallback product: {product}")
        period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')

        df_stock = pd.DataFrame(stock_data)
        df_transactions = pd.DataFrame(transaction_data)

        if not df_stock.empty and product not in df_stock['name'].values:
            logging.warning(f"Product {product} not found in stock_data")
            return jsonify({'error': f'Product {product} not found in stock'}), 400

        current_stock = int(df_stock[df_stock['name'] == product]['qty'].iloc[0]) if product in df_stock['name'].values else 0
        product_sales = int(df_transactions[df_transactions['product_name'] == product]['qty'].sum()) if not df_transactions.empty else 0
        total_sales = int(df_transactions['qty'].sum()) if not df_transactions.empty else 1
        sales_ratio = product_sales / total_sales if total_sales > 0 else 0
        logging.info(f"Processed: product={product}, current_stock={current_stock}, product_sales={product_sales}")

        X = [[current_stock, sales_ratio]]
        y = [product_sales] if product_sales > 0 else [0]

        # Removed strict data check; LinearRegression can handle single point
        model = LinearRegression()
        model.fit(X, y)
        future_demand = float(model.predict([[max(0, current_stock * 0.8), sales_ratio]])[0])
        future_demand = max(0, future_demand)

        prompt = f"Based on current stock {current_stock}, past sales {product_sales} for {product}, predict demand for {period}. Consider stock trends and keep it concise."
        try:
            response = client.chat.completions.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": prompt}])
            insight = response.choices[0].message.content
        except Exception as e:
            logging.error(f"OpenAI API error: {e}")
            insight = "Unable to generate insight due to API error."

        logging.info(f"Query: {query}, Stock: {current_stock}, Sales: {product_sales}, Forecast: {future_demand}, Insight: {insight}")
        if sales_ratio < 0.1 and product_sales > 0:
            logging.warning(f"Potential bias: Low sales ratio {sales_ratio} for {product}")

        return jsonify({
            'product': product,
            'period': period,
            'current_stock': int(current_stock),  # Ensure Python int
            'past_sales': int(product_sales),    # Ensure Python int
            'forecast_demand': future_demand,
            'insight': insight
        })

    except Exception as e:
        logging.error(f"Error in predict_demand: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
