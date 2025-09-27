from flask import Flask, request, jsonify
from flask_cors import CORS
import statistics
import logging
import pandas as pd
from dotenv import load_dotenv
import os
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=gemini_api_key)


# Logging
logging.basicConfig(filename='supply_checker_logs.txt', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    retry=retry_if_exception_type(Exception)
)
def generate_gemini_insight(prompt):
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text.strip()

app = Flask(__name__)
CORS(app)

@app.route("/supply-check", methods=["POST"])
def supply_check():
    try:
        data = request.get_json()
        query = data.get("query", "").lower()
        product_name = data.get("product_name", "").lower()
        stock_data = data.get("stock_data", [])

        if not product_name or not stock_data:
            return jsonify({"error": "Missing product_name or stock_data"}), 400

        # Collect suppliers for the given product
        supplier_stats = {}
        for stock in stock_data:
            # If Firestore stock only has flat structure (name + qty)
            if stock.get("name", "").lower() == product_name:
                supplier = stock.get("supplierName", "Unknown")  # fallback if missing
                if supplier not in supplier_stats:
                    supplier_stats[supplier] = {"total_qty": 0, "prices": []}
                supplier_stats[supplier]["total_qty"] += stock.get("qty", 0)
                if stock.get("purchase_price"):
                    supplier_stats[supplier]["prices"].append(stock["purchase_price"])

        if not supplier_stats:
            return jsonify({"message": f"No supplier found for {product_name}"}), 200

        # Rank suppliers by score (high qty, low avg price)
        results = []
        for supplier, stats in supplier_stats.items():
            avg_price = statistics.mean(stats["prices"]) if stats["prices"] else 0
            results.append({
                "supplier": supplier,
                "total_qty": stats["total_qty"],
                "avg_price": round(avg_price, 2),
                "score": stats["total_qty"] / (avg_price + 1)  # simple heuristic
            })

        # Sort best to worst
        results = sorted(results, key=lambda x: x["score"], reverse=True)

        # Generate Gemini insight
        prompt = f"Based on these suppliers for {product_name}: {results[:3]}, recommend the best one with reasoning. Keep it concise (1-2 sentences)."
        try:
            insight = generate_gemini_insight(prompt)
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            insight = "Gemini is temporarily unavailable. Pure Mills is recommended based on quantity and price."

        # Generate readable text
        response_text = f"Supplier Information for {product_name}:\n"
        response_text += f"- Best Supplier: {results[0]['supplier']} (Avg Price: ${results[0]['avg_price']}, Total Delivered: {results[0]['total_qty']} units)\n"
        response_text += "- All Suppliers:\n"
        for sup in results:
            response_text += f"  - {sup['supplier']}: {sup['total_qty']} units, Avg Price: ${sup['avg_price']}\n"
            response_text += f"- Insight: {insight}"

        logging.info(f"Supply Checker response: {response_text}")
        return jsonify({
            "readable_text": response_text,
            "query": query,
            "product_name": product_name,
            "best_supplier": results[0],
            "all_suppliers": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=True)
