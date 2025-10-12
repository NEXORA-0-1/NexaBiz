from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
from serpapi import GoogleSearch
from dotenv import load_dotenv
import os
import time
import requests

load_dotenv()  # Load environment variables from .env file
serpapi_key = os.getenv("SERPAPI_API_KEY")
if not serpapi_key:
    raise ValueError("SERPAPI_API_KEY not found in environment variables.")

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
# DuckDuckGo Web-Scraping Supplier Search
# ----------------------
def get_ddg_suppliers(product_name):
    try:
        params = {
            "q": f"{product_name} suppliers near me",
            "api_key": serpapi_key,
            "num": 5
        }
        search = GoogleSearch(params)
        results = search.get_dict()

        suppliers = []
        if 'organic_results' in results:
            for result in results['organic_results']:
                suppliers.append({
                    "name": result.get('title', 'Unknown Supplier'),
                    "url": result.get('link', ''),
                    "details": result.get('snippet', ''),
                    "rating": result.get('rating', 'N/A')  # If available
                })

        # Rate limit (1 req/sec)
        time.sleep(1)
        return suppliers
    except requests.exceptions.RequestException as e:
        print("serpAPI error:", e)
        return [{"name": "Error fetching suppliers", "url": "", "details": str(e)}]

# ----------------------
# Universal Endpoint
# ----------------------
@app.route("/ai", methods=["POST"])
def ai_handler():
    try:
        data = request.get_json()
        #print(" /ai received:", data)

        query = data.get("query", "").lower()
        stock_data = data.get("stock_data", [])
        transaction_data = data.get("transaction_data", [])

        # --- Intent Routing ---
        if "predict" in query and "demand" in query:
            response = run_demand_predictor(query, stock_data, transaction_data)

        elif "optimize" in query or "order" in query:
            response = order_optimizer(query, stock_data, transaction_data)

        elif "best supplier" in query or "who are the best suppliers" in query or "who are best supplier" in query:
            # Moved above generic "supplier" check
            product_name = (
                query.replace("who are the best suppliers for", "")
                     .replace("who are best supplier for", "")
                     .replace("best supplier for", "")
                     .strip()
            )
            print("🧩 Extracted product name:", product_name)
            suppliers = get_ddg_suppliers(product_name)
            response_text = f"Top suppliers for '{product_name}':\n"
            for sup in suppliers:
                response_text += f"- {sup['name']}: {sup['details']}\nLink: {sup['url']}\n"

            response = {"readable_text": response_text, "suppliers": suppliers}

        elif "supply" in query:
            # Handle supply checks separately, only when not "best supplier"
            product_name = query.split("for")[-1].strip() if "for" in query else None
            response = supply_checker(query, stock_data, product_name)

        else:
            response = {
                "readable_text": (
                    "⚠️ Sorry, I didn’t understand your request.\n\n"
                    "👉 Try:\n"
                    "- Predict demand for Beans next month\n"
                    "- Optimize my order for Sugar\n"
                    "- Find best supplier for Rice"
                )
            }

        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ----------------------
# Run Server
# ----------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
