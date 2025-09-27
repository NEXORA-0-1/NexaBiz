from flask import Flask, request, jsonify
from flask_cors import CORS
import statistics
import logging
import pandas as pd

# Logging
logging.basicConfig(filename='supply_checker_logs.txt', level=logging.INFO)

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

        # Generate readable text
        response_text = f"Supplier Information for {product_name}:\n"
        response_text += f"- Best Supplier: {results[0]['supplier']} (Avg Price: ${results[0]['avg_price']}, Total Delivered: {results[0]['total_qty']} units)\n"
        response_text += "- All Suppliers:\n"
        for sup in results:
            response_text += f"  - {sup['supplier']}: {sup['total_qty']} units, Avg Price: ${sup['avg_price']}\n"

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
