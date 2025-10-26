import spacy
from flask import Flask, request, jsonify
import pandas as pd
from prophet import Prophet
import google.generativeai as genai
from pytrends.request import TrendReq
import logging
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

# =========================================================
# 🔧 Environment Setup
# =========================================================
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=gemini_api_key)

# Logging
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO,
                    format='%(asctime)s %(levelname)s: %(message)s')

# NLP model
nlp = spacy.load("en_core_web_sm")

# Flask app
app = Flask(_name_)

# =========================================================
# 🧩 Utility Functions
# =========================================================
def normalize_name(name: str):
    return name.strip().lower() if isinstance(name, str) else ""

def flatten_transactions(transactions_list):
    flat_list = []
    for t in transactions_list:
        items = t.get('items', [])
        for item in items:
            flat_item = item.copy()
            flat_item['createdAt'] = t.get('createdAt')
            flat_list.append(flat_item)
    return pd.DataFrame(flat_list)

def get_google_trend_score(product_name: str):
    """Fetch trend score and change over last 3 months from Google Trends."""
    try:
        pytrends = TrendReq()
        pytrends.build_payload([product_name], timeframe='today 3-m')
        trend_data = pytrends.interest_over_time()
        if trend_data.empty:
            return 50, 0
        score = int(trend_data[product_name].iloc[-1])
        change = int(trend_data[product_name].iloc[-1] - trend_data[product_name].iloc[0])
        return score, change
    except Exception as e:
        logging.error(f"Google Trends error: {e}")
        return 50, 0

def fetch_ai_insight(product, current_stock, forecasted_demand, trend_score, trend_change, price_info, historical_sales):
    """
    Generate concise, actionable sales + inventory recommendation using Gemini 2.0.
    Output should be short, structured, and user-friendly.
    """
    # Convert historical_sales to simple comma-separated string
    sales_summary = ", ".join(map(str, historical_sales)) if historical_sales else "No recent data"

    prompt = (
        f"You are a sales assistant helping manage inventory, pricing, and marketing.\n"
        f"Product: {product}\n"
        f"Current Stock: {current_stock}\n"
        f"Forecasted Demand (next month): {forecasted_demand}\n"
        f"Historical Sales (last 3 months): {sales_summary}\n"
        f"Google Trends Score: {trend_score}/100 (change: {trend_change})\n"
        f"Base Cost: ${price_info.get('base_cost', '?')}, Suggested Price: ${price_info.get('suggested_price', '?')}\n\n"
        f"Instructions: Provide a concise, actionable summary with 3 sections:\n"
        f"1. Stock Management: what to order or adjust\n"
        f"2. Pricing: any changes or promotions\n"
        f"3. Marketing: simple, effective steps to increase sales\n"
        f"Keep it short, easy to read, and suitable for a business user. Use bullet points if helpful."
    )
    try:
        model_gemini = genai.GenerativeModel("gemini-2.0-flash-001")
        response = model_gemini.generate_content(prompt)
        return response.text
    except Exception as e:
        logging.error(f"Gemini AI error: {e}")
        return "Unable to generate AI insight."

# =========================================================
# 🔮 Demand Prediction Route
# =========================================================
@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        data = request.json
        query = data.get('query')
        stock_data = data.get('stock_data')
        transaction_data = data.get('transaction_data')

        if not query or not stock_data or not transaction_data:
            return jsonify({'error': 'Missing required data'}), 400

        # Extract product name
        doc = nlp(query)
        product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), None)
        if not product:
            product = query.lower().replace('predict demand for', '').replace('next month', '').strip()
        product_norm = normalize_name(product)

        # Convert data to DataFrames
        df_stock = pd.DataFrame(stock_data)
        df_transactions = flatten_transactions(transaction_data)

        # Normalize names
        if not df_stock.empty and 'product_name' in df_stock.columns:
            df_stock['name_norm'] = df_stock['product_name'].apply(normalize_name)
        if not df_transactions.empty and 'product_name' in df_transactions.columns:
            df_transactions['product_name_norm'] = df_transactions['product_name'].apply(normalize_name)

        # Validate product
        if df_stock.empty or product_norm not in df_stock['name_norm'].values:
            return jsonify({'error': f'Product {product} not found in stock'}), 400

        # Extract stock info
        stock_row = df_stock[df_stock['name_norm'] == product_norm].iloc[0]
        current_stock = int(stock_row['qty'])
        price_info = {
            'base_cost': stock_row.get('base_cost_usd', '?'),
            'suggested_price': stock_row.get('suggested_price_usd', '?')
        }

        # ===============================
        # 📊 Historical Sales + Forecast
        # ===============================
        forecasted_demand = 0
        historical_sales = []

        if not df_transactions.empty:
            df_sales = df_transactions[df_transactions['product_name_norm'] == product_norm]
            df_sales['createdAt'] = pd.to_datetime(df_sales['createdAt']).dt.tz_localize(None)

            # Filter recent 3 months
            three_months_ago = datetime.now() - timedelta(days=90)
            df_sales_recent = df_sales[df_sales['createdAt'] >= three_months_ago]

            if not df_sales_recent.empty:
                df_sales_recent['month'] = df_sales_recent['createdAt'].dt.to_period('M')
                monthly_sales = df_sales_recent.groupby('month')['qty'].sum().reset_index()
                historical_sales = monthly_sales['qty'].tolist()

                # Prepare Prophet-friendly data
                df_sales_ts = monthly_sales.copy()
                df_sales_ts['ds'] = df_sales_ts['month'].dt.to_timestamp()
                df_sales_ts['y'] = df_sales_ts['qty']

                try:
                    model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
                    model.fit(df_sales_ts[['ds', 'y']])
                    future = model.make_future_dataframe(periods=1, freq='M')
                    forecast = model.predict(future)
                    forecasted_demand = float(forecast['yhat'].iloc[-1])

                    # ✅ Fallback: if Prophet gives 0 or NaN, use recent average
                    if forecasted_demand <= 0 or pd.isna(forecasted_demand):
                        forecasted_demand = df_sales_recent['qty'].mean()

                except Exception as e:
                    logging.error(f"Prophet error: {e}")
                    forecasted_demand = df_sales_recent['qty'].mean()

        # Default if no data at all
        if forecasted_demand == 0:
            forecasted_demand = 10  # minimal fallback

        # ===============================
        # 📈 Stock Analysis
        # ===============================
        stock_coverage = int((current_stock / forecasted_demand) * 100) if forecasted_demand > 0 else 0
        reorder_qty = max(0, int(forecasted_demand - current_stock))

        # ===============================
        # 🌍 Google Trends
        # ===============================
        trend_score, trend_change = get_google_trend_score(product_norm)

        # ===============================
        # 🧠 AI Recommendation
        # ===============================
        ai_insight = fetch_ai_insight(
            product, current_stock, int(forecasted_demand),
            trend_score, trend_change, price_info, historical_sales
        )

        # ===============================
        # 🪶 Response Formatting
        # ===============================
        readable_text = f"""
🌿 Nexabiz AI Demand Forecast Report

🧵 Product: {product.title()}
📅 Forecast Period: Next Month
📈 Historical Sales (Last 3 Months): {historical_sales if historical_sales else 'No recent data'}
📊 Forecasted Demand: {int(forecasted_demand)} units
📦 Current Stock: {current_stock} units
📉 Stock Coverage: {stock_coverage}% of forecasted demand
🧮 Suggested Reorder Quantity: {reorder_qty} units
🌍 Google Trends (3-Month): {trend_score}/100 ({'increasing' if trend_change > 0 else 'decreasing'} by {abs(trend_change)})
💰 Pricing: Base ${price_info.get('base_cost')}, Suggested ${price_info.get('suggested_price')}

🧠 AI Recommendation:
{ai_insight}
"""

        # Logging for debugging
        logging.info({
            'product': product,
            'current_stock': current_stock,
            'forecasted_demand': forecasted_demand,
            'historical_sales': historical_sales,
            'stock_coverage': stock_coverage,
            'reorder_qty': reorder_qty,
            'trend_score': trend_score,
            'trend_change': trend_change
        })

        return jsonify({'readable_text': readable_text})

    except Exception as e:
        logging.error(f"Error in predict_demand: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# =========================================================
# 🚀 Run Server
# =========================================================
if _name_ == '_main_':
    app.run(host='0.0.0.0', port=5000, debug=True)