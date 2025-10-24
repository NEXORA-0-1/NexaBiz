from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
import re
import json

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# Helper: simple regex-based quantity detection
def parse_order_from_message(message, stock_data):
    """
    Detect products and quantities from a customer message.
    Returns: items = [{product_name, qty}]
    """
    items = []
    message_lower = message.lower()

    for product in stock_data:
        pname = product.get("product_name", "").lower()
        if not pname:
            continue

        # Check if product is mentioned in the message
        if pname in message_lower:
            qty = 1  # default quantity

            # Regex: number before or after product name
            # Examples matched:
            # "10 SCY Air Drift Tee" or "SCY Air Drift Tee 10"
            pattern = rf"(\d+)\s*{re.escape(pname)}|{re.escape(pname)}\s*(\d+)"
            match = re.search(pattern, message_lower)
            if match:
                # pick the group that matched
                qty = int(match.group(1) or match.group(2) or 1)

            # Add to items
            items.append({
                "product_name": product.get("product_name"),
                "qty": qty
            })

    return items

@app.route("/auto_reply", methods=["POST"])
def auto_reply():
    data = request.get_json()
    email = data.get("email", {})
    stock_data = data.get("stock_data", [])
    transaction_data = data.get("transaction_data", [])
    processed_order = data.get("processedOrder", None)  # optional: after backend processing

    customer_message = email.get("body", "")
    subject = email.get("subject", "")
    sender = email.get("from", "")

    # --- Detect order from message ---
    order_items = parse_order_from_message(customer_message, stock_data)
    order_detected = len(order_items) > 0

    # --- Build prompt for AI ---
    prompt = f"""
    You are Nexabiz AI, a friendly and professional customer support assistant.

    A customer named {sender} sent this message:

    Subject: {subject}
    Message: {customer_message}

    You have access to this business data:
    - Current stock: {stock_data}
    - Recent transactions: {transaction_data}

    {'The customer wants to order the following items: ' + json.dumps(order_items) if order_detected else 'No order detected.'}

    Write a polite, natural **HTML email** with short readable paragraphs (<p> tags).
    ❌ Do NOT use ```html or markdown formatting.
    ✅ Only return clean HTML paragraph structure (<p>...</p>).
    """

    # If backend has processed the order, include confirmation
    if processed_order:
        prompt += f"\n\nProcessed order details: {json.dumps(processed_order)}"
        prompt += "\nInclude which items are confirmed and which are out of stock."

    prompt += "\nEnd with: <br><br>Best regards,<br>The Nexabiz Team"

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-001")
        result = model.generate_content(prompt)
        reply_text = result.text.strip()
        return jsonify({
            "reply": reply_text,
            "orderDetected": order_detected,
            "customer_name": sender,
            "items": order_items
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005, debug=True)
