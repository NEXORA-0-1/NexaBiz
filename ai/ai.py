from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai

# ----------------------
# Load environment variables
# ----------------------
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=gemini_api_key)

# ----------------------
# Flask app
# ----------------------
app = Flask(__name__)
CORS(app)

# ----------------------
# Helper to call demand_predictor.py via HTTP
# ----------------------
def run_demand_predictor(query, stock_data, transaction_data):
    try:
        url = "http://127.0.0.1:5000/predict_demand"  # demand_predictor Flask endpoint
        payload = {
            "query": query,
            "stock_data": stock_data,
            "transaction_data": transaction_data
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            return {"error": f"demand_predictor returned {response.status_code}: {response.text}"}
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Request to demand_predictor failed: {str(e)}"}

# ----------------------


def run_auto_reply(email_text):
    try:
        url = "http://127.0.0.1:5004/auto_reply"  # your auto_reply_agent endpoint
        payload = {"email_text": email_text}
        response = requests.post(url, json=payload, timeout=15)
        if response.status_code != 200:
            return {"error": f"auto_reply_agent returned {response.status_code}: {response.text}"}
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Request to auto_reply_agent failed: {str(e)}"}


# Dummy agents
# ----------------------
def run_order_optimizer(query, stock_data, transaction_data):
    try:
        url = "http://127.0.0.1:5003/optimize_order"  # order_optimizer Flask endpoint
        payload = {
            "query": query,
            "stock_data": stock_data,
            "transaction_data": transaction_data
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            return {"error": f"order_optimizer returned {response.status_code}: {response.text}"}
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Request to order_optimizer failed: {str(e)}"}


def supply_checker(query, stock_data, product_name=None):
    try:
        url = "http://127.0.0.1:5002/supply-check"  # supply_checker Flask endpoint
        payload = {
            "query": query,
            "stock_data": stock_data,
            "product_name": product_name
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            return {"error": f"supply_checker returned {response.status_code}: {response.text}"}
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Request to supply_checker failed: {str(e)}"}

# ----------------------
# Universal Endpoint
# ----------------------
@app.route('/ai', methods=['POST'])
def ai_handler():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        stock_data = data.get('stock_data', [])
        transaction_data = data.get('transaction_data', [])

        query_lower = query.lower()

        # Route query to appropriate module
        if "predict" in query_lower and "demand" in query_lower:
            response = run_demand_predictor(query, stock_data, transaction_data)
        elif "optimize" in query or "order" in query:
            response = run_order_optimizer(query, stock_data, transaction_data)
        elif "supply" in query or "supplier" in query:
            product_name = query.split("for")[-1].strip() if "for" in query else None
            response = supply_checker(query, stock_data, product_name)
        else:
            # Fallback to Gemini AI for general queries
            try:
                model_gemini = genai.GenerativeModel("gemini-2.0-flash-001")  # Use any available model
                gemini_response = model_gemini.generate_content(query)
                response = {
                    "readable_text": gemini_response.text
                }
            except Exception as e:
                response = {
                    "readable_text": (
                        "⚠️ I'm having trouble responding right now.\n\n"
                        "👉 Try asking about demand, orders or supply."
                    ),
                    "error": str(e)
                }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
# Run Server
# ----------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)


