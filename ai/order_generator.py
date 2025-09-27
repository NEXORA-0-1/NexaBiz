from flask import Flask, request, jsonify
import pdfplumber
import logging
from flask_cors import CORS
import re
from rapidfuzz import process
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Logging
logging.basicConfig(filename="order_generator_logs.txt", level=logging.INFO)

# Initialize Firebase Admin
cred = credentials.Certificate('./firebaseKey.json')  # replace with your Firebase service key
firebase_admin.initialize_app(cred)
db = firestore.client()

# Helper functions
def normalize_line(line: str) -> str:
    """Normalize dash types and trim spaces."""
    line = line.replace("–", "-").replace("—", "-")
    line = re.sub(r"-{2,}", "-", line)  # collapse --- or ---- into a single -
    return line.strip()


def fetch_products_from_firestore(user_id: str):
    """Fetch product names from Firestore for the current user."""
    product_docs = db.collection("users").document(user_id).collection("products").stream()
    return [doc.to_dict()["name"] for doc in product_docs]

def fuzzy_match_product(name: str, firestore_products: list) -> str:
    """Fuzzy match product name against Firestore product list."""
    best_match, score, _ = process.extractOne(name, firestore_products)
    if score > 80:  # threshold can be adjusted
        return best_match
    return None  # ignore unknown products

def parse_product_line(line: str, firestore_products: list):
    """Parse a line to extract product name and quantity."""
    line = normalize_line(line)

    # Case 1: "Product - Quantity"
    if "-" in line:
        parts = line.split("-")
        if len(parts) == 2:
            product_name = parts[0].strip()
            qty_str = parts[1].strip()
            qty = int(re.sub(r"\D", "", qty_str) or 0)
            product_name = fuzzy_match_product(product_name, firestore_products)
            if product_name and qty > 0:
                return product_name, qty

    # Case 2: "10 kg of Sugar" or "10 Sugar"
    match = re.match(r"(\d+)\s*(\w*)\s*(?:of\s+)?(.+)", line, re.IGNORECASE)
    if match:
        qty = int(match.group(1))
        product_name = match.group(3).strip()
        product_name = fuzzy_match_product(product_name, firestore_products)
        if product_name and qty > 0:
            return product_name, qty

    return None, None


@app.route("/generate_order_from_pdf", methods=["POST"])
def generate_order_from_pdf():
    try:
        if "file" not in request.files or "user_id" not in request.form:
            return jsonify({"error": "No file or user_id provided"}), 400

        file = request.files["file"]
        user_id = request.form["user_id"]

        # Get Firestore products
        firestore_products = fetch_products_from_firestore(user_id)

        # Extract text from PDF
        text = ""
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"

        lines = text.split("\n")
        order_data = {"supplier": "", "products": []}

        for line in lines:
            line = normalize_line(line)
            # Supplier
            if "supplier:" in line.lower():
                order_data["supplier"] = line.split(":")[1].strip()
            else:
                product_name, qty = parse_product_line(line, firestore_products)
                if product_name and qty:
                    order_data["products"].append({"name": product_name, "qty": qty})

        return jsonify({
            "readable_text": "PDF parsed successfully!",
            "order": order_data
        })

    except Exception as e:
        logging.error(f"Error parsing PDF: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
