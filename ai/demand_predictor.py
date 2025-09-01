import spacy
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
from openai import OpenAI
import logging
import os
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=openai_api_key)

# Setup logging for Responsible AI (transparency)
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)

@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    data = request.json
    query = data.get('query')  # e.g., "Predict demand for green leaves next month"
    stock_data = data.get('stock_data')  # e.g., [{"id": "doc_id", "name": "green leaves", "qty": 133}]
    transaction_data = data.get('transaction_data')  # e.g., [{"product_name": "Beans", "qty": 12}, ...]

    # NLP: Parse query
    doc = nlp(query)
    product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), 'default_product')
    period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')

    # Prepare data for prediction
    # Convert transaction data to DataFrame (qty sold over time)
    if not transaction_data or not stock_data:
        return jsonify({'error': 'Insufficient data'}), 400

    df_transactions = pd.DataFrame(transaction_data)
    df_stock = pd.DataFrame(stock_data)
    current_stock = df_stock[df_stock['name'] == product]['qty'].iloc[0] if product in df_stock['name'].values else 0

    # Aggregate sales by product (simplified: assume recent transactions)
    product_sales = df_transactions[df_transactions['product_name'] == product]['qty'].sum() if not df_transactions.empty else 0
    total_sales = df_transactions['qty'].sum() if not df_transactions.empty else 1  # Avoid division by zero
    sales_ratio = product_sales / total_sales if total_sales > 0 else 0  # Proportion of total sales

    # Feature engineering: Use stock level and sales ratio as predictors
    X = [[current_stock, sales_ratio]]  # Simple features: stock level, sales trend
    y = [product_sales]  # Target: past sales as proxy for demand

    # Train a simple model (Responsible AI: check if data is meaningful)
    if len(X) < 2 or len(y) < 2:
        logging.warning(f'Insufficient data for {product}: X={X}, y={y}')
        return jsonify({'error': 'Not enough data for prediction'}), 400

    model = LinearRegression()
    model.fit(X, y)
    # Predict future demand (assume stock decreases, adjust based on sales ratio)
    future_demand = model.predict([[current_stock * 0.9, sales_ratio]])[0]  # 10% stock reduction assumption
    future_demand = max(0, future_demand)  # Ensure non-negative

    # LLM for insight
    prompt = f"Based on stock level {current_stock} and past sales {product_sales} for {product}, predict demand for {period}. Consider trends and keep it concise."
    response = client.chat.completions.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": prompt}])
    insight = response.choices[0].message.content

    # Responsible AI: Log for transparency and check bias (e.g., low sales variance)
    logging.info(f"Query: {query}, Stock: {current_stock}, Sales: {product_sales}, Forecast: {future_demand}, Insight: {insight}")
    if sales_ratio < 0.1 and product_sales > 0:
        logging.warning(f'Potential bias: Low sales ratio {sales_ratio} for {product}')

    return jsonify({
        'product': product,
        'period': period,
        'current_stock': current_stock,
        'past_sales': product_sales,
        'forecast_demand': float(future_demand),  # Ensure float for JSON
        'insight': insight
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)