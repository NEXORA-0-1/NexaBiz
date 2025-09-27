from flask import Flask, request, jsonify
import pdfplumber
import logging
from flask_cors import CORS   # 🔹 add this

app = Flask(__name__)
CORS(app)  # 🔹 allow requests from frontend

logging.basicConfig(filename="order_generator_logs.txt", level=logging.INFO)

@app.route("/generate_order_from_pdf", methods=["POST"])
def generate_order_from_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]

        text = ""
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"

        lines = text.split("\n")
        order_data = {"supplier": "", "products": []}

        for line in lines:
            if "supplier:" in line.lower():
                order_data["supplier"] = line.split(":")[1].strip()
            elif "-" in line:  # assume "Product - Quantity"
                parts = line.split("-")
                if len(parts) == 2:
                    product_name = parts[0].strip()
                    try:
                        qty = int(parts[1].strip().replace("kg", ""))
                    except:
                        qty = 0
                    order_data["products"].append({"name": product_name, "qty": qty})

        return jsonify({"readable_text": "PDF parsed successfully!", "order": order_data})

    except Exception as e:
        logging.error(f"Error parsing PDF: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
