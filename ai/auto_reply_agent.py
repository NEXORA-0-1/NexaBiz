from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
import re
import json

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

NUMBER_WORDS = {
    "zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,
    "ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,
    "seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,"thirty":30,"forty":40,"fifty":50,
    "sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100,"thousand":1000
}

def words_to_num(text):
    parts = re.findall(r'\w+', text.lower())
    total, current, seen = 0, 0, False
    for p in parts:
        if p in NUMBER_WORDS:
            seen = True
            val = NUMBER_WORDS[p]
            if val in (100, 1000):
                current = max(1, current) * val
            else:
                current += val
        else:
            total += current
            current = 0
    total += current
    return total if seen else None

def parse_order_from_message(message, stock_data):
    """
    Returns:
    - order_items: [{ product_name, qty }]
    - mentioned_products: [product_name]
    """
    if not message or not stock_data:
        return [], []

    text = re.sub(r'\s+', ' ', message.lower())
    text = text.replace('qyt', 'qty')

    prod_map = {
        p["product_name"].lower(): p["product_name"]
        for p in stock_data if p.get("product_name")
    }

    order_items = []
    mentioned_products = []

    for pname_lower, pname_raw in prod_map.items():
        esc = re.escape(pname_lower)
        matches = []

        high_patterns = [
            rf'(\d+)\s*(?:qty|pcs|units|x)?\s*(?:of\s+)?(?:the\s+)?{esc}',
            rf'{esc}(?:\s+product)?\s*(?:qty|pcs|units|x)?\s*(\d+)\b'
        ]

        for pat in high_patterns:
            for m in re.finditer(pat, text):
                matches.append(int(m.group(1)))

        if matches:
            order_items.append({
                "product_name": pname_raw,
                "qty": matches[-1]
            })
        else:
            if re.search(esc, text):
                mentioned_products.append(pname_raw)

    return order_items, mentioned_products


@app.route("/auto_reply", methods=["POST"])
def auto_reply():
    data = request.get_json()

    email = data.get("email", {})
    stock_data = data.get("stock_data", [])
    processed_order = data.get("processedOrder")

    customer_message = email.get("body", "")
    subject = email.get("subject", "")
    sender = email.get("from", "")

    order_items, mentioned_products = parse_order_from_message(customer_message, stock_data)
    intent = "order" if order_items else "inquiry"

    # stock lookup for all products
    stock_lookup = {p["product_name"]: p.get("stock", "unknown") for p in stock_data}

    prompt = f"""
You are Nexabiz AI, a professional customer support assistant.
Customer email: {sender}
Subject: {subject}
Customer message:
{customer_message}
"""

    if processed_order:
        # If order has been processed, focus on items and stock
        prompt += f"""
The customer order has been successfully processed:
{json.dumps(processed_order)}

For each item in the processed order, mention:
- product name
- ordered quantity
- stock remaining
Do NOT mention products that were not ordered.
Write a concise, polite HTML email starting with <p> and ending with:
<br><br>Best regards,<br>The Nexabiz Team
"""
    elif intent == "order":
        # Customer wants to place order but not processed yet
        prompt += f"""
The customer wants to place an order for:
{json.dumps(order_items)}

Acknowledge the order politely.
Mention stock availability for each requested item.
Do NOT assume payment.
Write a concise HTML email starting with <p> and ending with:
<br><br>Best regards,<br>The Nexabiz Team
"""
    else:
        # General inquiry
        inquiry_stock = {p: stock_lookup.get(p, "unknown") for p in mentioned_products}
        prompt += f"""
The customer is asking about product availability:
{json.dumps(inquiry_stock)}
Write a polite HTML email, only mentioning requested products.
Do NOT treat this as an order.
Start with <p> and end with:
<br><br>Best regards,<br>The Nexabiz Team
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        result = model.generate_content(prompt)
        reply_text = result.text.strip()

        return jsonify({
            "reply": reply_text,
            "intent": intent,
            "orderDetected": intent == "order",
            "items": order_items,
            "mentionedProducts": mentioned_products
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005, debug=True)
