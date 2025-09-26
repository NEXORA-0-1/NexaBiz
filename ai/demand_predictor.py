import spacy
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
import google.generativeai as genai
import logging
import os
from dotenv import load_dotenv
import numpy as np

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

print("Gemini API Key loaded:", gemini_api_key[:6], "…")
genai.configure(api_key=gemini_api_key)

# Logging
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

# Load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logging.error(f"Failed to load spaCy model: {e}")
    raise

# Flask app
app = Flask(__name__)

def normalize_name(name: str) -> str:
    """Normalize product names for consistent comparison."""
    return name.strip().lower() if isinstance(name, str) else ""

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

        # Extract product and time from query
        doc = nlp(query)
        product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), None)
        logging.info(f"Entities: {[(ent.text, ent.label_) for ent in doc.ents]}")
        if not product:
            # Fallback: Extract product from query manually
            product = query.lower().replace('predict demand for', '').replace('next month', '').strip()
            logging.info(f"Fallback product: {product}")
        period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')

        # Normalize product name
        product_norm = normalize_name(product)

        # Convert to DataFrames
        df_stock = pd.DataFrame(stock_data)
        df_transactions = pd.DataFrame(transaction_data)

        # Normalize names in DataFrames
        if not df_stock.empty and 'name' in df_stock.columns:
            df_stock['name_norm'] = df_stock['name'].apply(normalize_name)
        if not df_transactions.empty and 'product_name' in df_transactions.columns:
            df_transactions['product_name_norm'] = df_transactions['product_name'].apply(normalize_name)

        # Validate product in stock
        if not df_stock.empty and product_norm not in df_stock['name_norm'].values:
            logging.warning(f"Product {product} not found in stock_data")
            return jsonify({'error': f'Product {product} not found in stock'}), 400

        # Calculate values
        current_stock = int(
            df_stock[df_stock['name_norm'] == product_norm]['qty'].iloc[0]
        ) if product_norm in df_stock['name_norm'].values else 0

        product_sales = int(
            df_transactions[df_transactions['product_name_norm'] == product_norm]['qty'].sum()
        ) if not df_transactions.empty else 0

        total_sales = int(df_transactions['qty'].sum()) if not df_transactions.empty else 1
        sales_ratio = product_sales / total_sales if total_sales > 0 else 0
        logging.info(f"Processed: product={product_norm}, current_stock={current_stock}, product_sales={product_sales}")

        # Simple regression model
        X = [[current_stock, sales_ratio]]
        y = [product_sales] if product_sales > 0 else [0]

        model = LinearRegression()
        model.fit(X, y)
        future_demand = float(model.predict([[max(0, current_stock * 0.8), sales_ratio]])[0])
        future_demand = max(0, future_demand)

        # Generate Gemini insight
        prompt = f"Based on current stock {current_stock}, past sales {product_sales} for {product}, predict demand for {period}. Keep it concise."
        try:
            model_gemini = genai.GenerativeModel("gemini-1.5-flash")
            response = model_gemini.generate_content(prompt)
            insight = response.text
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            insight = "Unable to generate insight due to API error."

        # Create human-readable summary
        readable_text = (
            f"🌿 Nexabiz AI Forecast:\n"
            f"For {product.title()} {period}, you currently have {current_stock} in stock.\n"
            f"Last month you sold {product_sales} units.\n"
            f"We predict you'll need {int(future_demand)} units.\n"
            f"{insight}"
        )

        # Log full JSON for debugging
        logging.info({
            'product': product,
            'period': period,
            'current_stock': current_stock,
            'past_sales': product_sales,
            'forecast_demand': future_demand,
            'insight': insight
        })

        # Return only readable text to frontend
        return jsonify({'readable_text': readable_text})

    except Exception as e:
        logging.error(f"Error in predict_demand: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
