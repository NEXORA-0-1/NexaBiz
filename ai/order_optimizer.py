from flask import Flask, request, jsonify
import pandas as pd
import logging
import os
from dotenv import load_dotenv
import google.generativeai as genai

# ----------------------
# Setup
# ----------------------
app = Flask(__name__)
logging.basicConfig(filename="order_optimizer_logs.txt", level=logging.INFO)

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

print("Gemini API Key loaded:", gemini_api_key[:6], "…")
genai.configure(api_key=gemini_api_key)

# ----------------------
# Helper
# ----------------------
def normalize_name(name: str) -> str:
    return name.strip().lower() if isinstance(name, str) else ""

# ----------------------
# Endpoint
# ----------------------
@app.route("/optimize_order", methods=["POST"])
def optimize_order():
    try:
        data = request.json
        query = data.get("query")
        stock_data = data.get("stock_data")
        transaction_data = data.get("transaction_data")

        if not query or not stock_data or not transaction_data:
            return jsonify({"error": "Missing query, stock_data, or transaction_data"}), 400

        # Extract product
        product = query.lower().replace("optimize order for", "").strip()
        product_norm = normalize_name(product)

        # Convert to DataFrames
        df_stock = pd.DataFrame(stock_data)
        df_transactions = pd.DataFrame(transaction_data)

        if not df_stock.empty and "name" in df_stock.columns:
            df_stock["name_norm"] = df_stock["name"].apply(normalize_name)
        if not df_transactions.empty and "product_name" in df_transactions.columns:
            df_transactions["product_name_norm"] = df_transactions["product_name"].apply(normalize_name)

        # Current stock
        current_stock = int(
            df_stock[df_stock["name_norm"] == product_norm]["qty"].iloc[0]
        ) if product_norm in df_stock["name_norm"].values else 0

        # Past sales
        product_sales = df_transactions[df_transactions["product_name_norm"] == product_norm]["qty"]
        avg_sales = int(product_sales.mean()) if not product_sales.empty else 0

        # Safety stock rule
        safety_stock = int(avg_sales * 0.2)  # 20% of avg monthly sales

        # Suggested order
        required_qty = max(0, (avg_sales + safety_stock) - current_stock)

        # ----------------------
        # Gemini insight
        # ----------------------
        prompt = (
            f"You are an inventory management assistant.\n"
            f"Product: {product.title()}\n"
            f"Current stock: {current_stock}\n"
            f"Average monthly sales: {avg_sales}\n"
            f"Safety stock: {safety_stock}\n"
            f"Suggested order: {required_qty}\n\n"
            f"👉 Provide a short, helpful insight about why this order makes sense "
            f"and how it will prevent stockouts or overstocking. Keep it under 2 sentences."
        )

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            insight = response.text
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            insight = "Unable to generate insight due to API error."

        # Human-readable summary
        readable_text = (
            f"🛒 Order Optimization:\n"
            f"Product: {product.title()}\n"
            f"Current stock: {current_stock}\n"
            f"Avg. sales: {avg_sales} units/month\n"
            f"Safety stock: {safety_stock} units\n"
            f"👉 Suggested order: {required_qty} units\n\n"
            f"💡 Insight: {insight}"
        )

        return jsonify({
            "readable_text": readable_text,
            "details": {
                "product": product,
                "current_stock": current_stock,
                "avg_sales": avg_sales,
                "safety_stock": safety_stock,
                "suggested_order": required_qty,
                "insight": insight
            }
        })

    except Exception as e:
        logging.error(f"Error in optimize_order: {e}")
        return jsonify({"error": str(e)}), 500

# ----------------------
# Run
# ----------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
