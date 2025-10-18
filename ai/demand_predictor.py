import spacy
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import pickle
import logging
import os
from dotenv import load_dotenv
from rapidfuzz import process, fuzz
import google.generativeai as genai

# ------------------ Load environment variables ------------------
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=gemini_api_key)

# ------------------ Logging ------------------
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

# ------------------ Load spaCy NLP model ------------------
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logging.error(f"Failed to load spaCy model: {e}")
    raise

# ------------------ Safe paths for model and columns ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'demand_predictor_model.pkl')
COLUMNS_PATH = os.path.join(BASE_DIR, 'columns.pkl')

# Load trained LightGBM model
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train the model first.")
model = joblib.load(MODEL_PATH)

# Load preprocessing columns
if not os.path.exists(COLUMNS_PATH):
    raise FileNotFoundError(f"Columns file not found at {COLUMNS_PATH}. Save columns after training.")
with open(COLUMNS_PATH, 'rb') as f:
    model_columns = pickle.load(f)

# ------------------ Flask app ------------------
app = Flask(__name__)

# ------------------ Utility functions ------------------
def normalize_name(name: str) -> str:
    return name.strip().lower() if isinstance(name, str) else ""

def fuzzy_match_product(product_norm, product_list, threshold=70):
    if not product_list:
        return None
    best_match = process.extractOne(product_norm, product_list, scorer=fuzz.WRatio)
    if best_match and best_match[1] >= threshold:
        return best_match[0]
    return None

# ------------------ Predict demand endpoint ------------------
@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        data = request.json
        query = data.get('query')
        stock_data = data.get('stock_data')
        transaction_data = data.get('transaction_data')
        logging.info(f"Received: query={query}, stock_data={stock_data}, transaction_data={transaction_data}")

        if not query or not stock_data or not transaction_data:
            return jsonify({'error': 'Missing required data'}), 400

        # Extract product and period
        doc = nlp(query)
        product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), None)
        if not product:
            product = query.lower().replace('predict demand for', '').replace('next month', '').strip()
        period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')
        product_norm = normalize_name(product)

        # Convert input to DataFrames
        df_stock = pd.DataFrame(stock_data)
        df_transactions = pd.DataFrame([item for t in transaction_data for item in t['items']]) if transaction_data else pd.DataFrame()

        # Normalize product names
        if not df_stock.empty and 'product_name' in df_stock.columns:
            df_stock['product_name_norm'] = df_stock['product_name'].apply(normalize_name)
        if not df_transactions.empty and 'product_name' in df_transactions.columns:
            df_transactions['product_name_norm'] = df_transactions['product_name'].apply(normalize_name)

        # Fuzzy match if needed
        if not df_stock.empty and product_norm not in df_stock['product_name_norm'].values:
            product_norm_fuzzy = fuzzy_match_product(product_norm, df_stock['product_name_norm'].tolist())
            if product_norm_fuzzy:
                product_norm = product_norm_fuzzy
            else:
                return jsonify({'error': f'Product {product} not found in stock'}), 400

        # Extract current stock
        current_stock = int(df_stock[df_stock['product_name_norm'] == product_norm]['qty'].iloc[0]) if product_norm in df_stock['product_name_norm'].values else 0

        # Aggregate past sales
        product_sales = int(df_transactions[df_transactions['product_name_norm'] == product_norm]['qty'].sum()) if not df_transactions.empty else 0
        total_sales = int(df_transactions['qty'].sum()) if not df_transactions.empty else 1
        sales_ratio = product_sales / total_sales

        # Prepare features for model
        X_new = pd.DataFrame([{
            'current_stock': current_stock,
            'product_sales_ratio': sales_ratio,
            # You can add external features here later
        }])

        # Align columns with training
        X_new = pd.get_dummies(X_new)
        X_new = X_new.reindex(columns=model_columns, fill_value=0)
        
        # Debug Logging – Confirm Model + Inputs
        logging.info(f"Using model type: {type(model)}")
        logging.info(f"Model input features: {X_new.to_dict(orient='records')}")
        future_demand_raw = model.predict(X_new)[0]
        logging.info(f"Raw model prediction output: {future_demand_raw}")

        # Predict demand
        future_demand = int(max(0, model.predict(X_new)[0]))

        # Gemini insight
        prompt = f"Based on current stock {current_stock}, past sales {product_sales} for {product}, predict demand for {period}. Keep it concise."
        try:
            model_gemini = genai.GenerativeModel("gemini-2.0-flash-001")
            response = model_gemini.generate_content(prompt)
            insight = response.text
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            insight = "Unable to generate insight due to API error."

        # Return summary
        readable_text = (
            f"🌿 Nexabiz AI Forecast:\n"
            f"For {product} {period}, you currently have {current_stock} in stock.\n"
            f"Last month you sold {product_sales} units.\n"
            f"We predict you'll need {future_demand} units.\n"
            f"{insight}"
        )

        logging.info({
            'product': product,
            'period': period,
            'current_stock': current_stock,
            'past_sales': product_sales,
            'forecast_demand': future_demand,
            'insight': insight
        })

        return jsonify({'readable_text': readable_text})

    except Exception as e:
        logging.error(f"Error in predict_demand: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
