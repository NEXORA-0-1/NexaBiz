from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

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
# Dummy agents
# ----------------------
def order_optimizer(query, stock_data, transaction_data):
    return {
        "readable_text": f"🛒 Order Optimizer (dummy) for: '{query}'",
        "details": {
            "suggested_order": "e.g., Buy 10 more units of Rice"
        }
    }

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
        query = data.get('query', '').lower()
        stock_data = data.get('stock_data', [])
        transaction_data = data.get('transaction_data', [])

        # Route query
        if "predict" in query and "demand" in query:
            response = run_demand_predictor(query, stock_data, transaction_data)
        elif "optimize" in query or "order" in query:
            response = order_optimizer(query, stock_data, transaction_data)
        elif "supply" in query or "supplier" in query:
            product_name = query.split("for")[-1].strip() if "for" in query else None
            response = supply_checker(query, stock_data, product_name)
        else:
            response = {
                "readable_text": (
                    "⚠️ Sorry, I didn’t understand your request.\n\n"
                    "👉 Try:\n"
                    "- Predict demand for Beans next month\n"
                    "- Optimize my order for Sugar\n"
                    "- Check supply for Rice"
                )
            }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
# Run Server
# ----------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
