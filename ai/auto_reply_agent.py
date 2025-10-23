from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

@app.route("/auto_reply", methods=["POST"])
def auto_reply():
    data = request.get_json()
    email = data.get("email", {})
    stock_data = data.get("stock_data", [])
    transaction_data = data.get("transaction_data", [])

    customer_message = email.get("body", "")
    subject = email.get("subject", "")
    sender = email.get("from", "")

    # --- Create a detailed natural prompt ---
    prompt = f"""
    You are Nexabiz AI, a friendly and professional customer support assistant.

    A customer named {sender} sent this message:

    Subject: {subject}
    Message: {customer_message}

    You have access to this business data:
    - Current stock: {stock_data}
    - Recent transactions: {transaction_data}

    Write a polite, natural **HTML email** with short readable paragraphs (<p> tags).
    ❌ Do NOT use ```html or markdown formatting.
    ✅ Only return clean HTML paragraph structure (<p>...</p>).
    End with: <br><br>Best regards,<br>The Nexabiz Team
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-001")
        result = model.generate_content(prompt)
        reply_text = result.text.strip()
        return jsonify({"reply": reply_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005, debug=True)
