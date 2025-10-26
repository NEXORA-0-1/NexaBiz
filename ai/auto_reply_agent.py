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
# small word→number map for common words
NUMBER_WORDS = {
    "zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,
    "ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,
    "seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,"thirty":30,"forty":40,"fifty":50,
    "sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100,"thousand":1000
}

def words_to_num(text):
    """Best-effort convert small number-words (handles up to thousands). Returns int or None."""
    parts = re.findall(r'\w+', text.lower())
    if not parts:
        return None
    total = 0
    current = 0
    seen = False
    for p in parts:
        if p in NUMBER_WORDS:
            seen = True
            val = NUMBER_WORDS[p]
            if val == 100 or val == 1000:
                if current == 0:
                    current = 1
                current *= val
            else:
                current += val
        else:
            if current:
                total += current
                current = 0
    total += current
    return total if seen else None

def parse_order_from_message(message, stock_data):
    """
    Robust extraction of ordered items from free text.
    Returns a list: [{ "product_name": <original product name>, "qty": <int> }, ...]
    Selection strategy:
      - Prefer explicit 'qty/pcs/units/x/of/from/for' patterns (high priority)
      - Then numeric adjacent to product (medium)
      - Then number-words in a small window (low)
      - If multiple matches at same priority, pick the last one (by position)
      - Do NOT sum across matches — pick the single best quantity
    """
    if not message or not stock_data:
        return []

    text = message.lower()
    # normalize punctuation & common typos
    text = re.sub(r'[\n\r,;•]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace('qyt', 'qty')  # common typo

    # build product maps
    prod_map = {}
    for p in stock_data:
        pname_raw = p.get("product_name") or ""
        pname = pname_raw.strip().lower()
        if pname:
            prod_map[pname] = pname_raw

    results = []

    # for each product find candidate matches with (position, value, priority)
    for pname_lower, pname_raw in prod_map.items():
        matches = []
        esc = re.escape(pname_lower)

        # High priority patterns: explicit qty / qty-from / x / of
        high_patterns = [
            rf'(\d{{1,7}})\s*(?:qty|pcs|units|qts|qnt)\s*(?:from|for)?\s*{esc}',
            rf'(\d{{1,7}})\s*(?:x)\s*{esc}',
            rf'(\d{{1,7}})\s*(?:of)\s*{esc}',
            rf'{esc}\s*(?:from|for)\s*(?:about|around)?\s*(\d{{1,7}})\b',
            rf'(\d{{1,7}})\s*(?:qty|pcs|units|qts|qnt)\s*{esc}'
        ]
        for pat in high_patterns:
            for m in re.finditer(pat, text, flags=re.IGNORECASE):
                try:
                    val = int(m.group(1))
                    matches.append((m.start(), val, 3))
                except:
                    pass

        # Medium priority: number directly before product or after product (e.g., '10 product' or 'product 10')
        med_patterns = [
            rf'(\d{{1,7}})\s+{esc}',           # number before product
            rf'{esc}\s*[-:]*\s*(\d{{1,7}})\b'  # product 10
        ]
        for pat in med_patterns:
            for m in re.finditer(pat, text, flags=re.IGNORECASE):
                try:
                    val = int(m.group(1))
                    matches.append((m.start(), val, 2))
                except:
                    pass

        # Low priority: number-words in a window around the product (up to 6 words before/after)
        window_pattern = rf'(?:\b(?:\w+\s+){{0,6}}{esc}(?:\s+\w+){{0,6}}\b)'
        for m in re.finditer(window_pattern, text, flags=re.IGNORECASE):
            span = m.group(0)
            num_word_val = words_to_num(span)
            if num_word_val:
                matches.append((m.start(), int(num_word_val), 1))

        # As fallback: any digit within a short nearby substring (very low priority)
        if not matches:
            for m in re.finditer(esc, text):
                start = max(0, m.start() - 12)
                end = min(len(text), m.end() + 12)
                nearby = text[start:end]
                n = re.search(r'(\d{1,7})', nearby)
                if n:
                    try:
                        matches.append((m.start(), int(n.group(1)), 0))
                    except:
                        pass

        # Decide final qty: pick the highest priority matches, then the last one among them
        chosen_qty = None
        if matches:
            max_prio = max(m[2] for m in matches)
            candidates = [m for m in matches if m[2] == max_prio]
            # pick the candidate with largest position (last occurrence)
            chosen = sorted(candidates, key=lambda x: x[0])[-1]
            chosen_qty = int(chosen[1])
        else:
            # product mentioned but no number found -> default 1
            if re.search(esc, text):
                chosen_qty = 1

        if chosen_qty:
            results.append({
                "product_name": pname_raw,
                "qty": int(chosen_qty)
            })

    return results

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
    Return **only raw HTML**, with <p> tags and <br> for line breaks.
    Do NOT include ```html, markdown, or backticks in your reply.
    Your entire response must start with <p> and contain no markdown fences.
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
