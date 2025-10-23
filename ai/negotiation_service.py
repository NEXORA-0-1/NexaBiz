from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os
from dotenv import load_dotenv
import logging
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
MAILTRAP_SMTP_HOST = os.getenv("MAILTRAP_SMTP_HOST")
MAILTRAP_SMTP_PORT = int(os.getenv("MAILTRAP_SMTP_PORT", 2525))
MAILTRAP_USERNAME = os.getenv("MAILTRAP_USERNAME")
MAILTRAP_PASSWORD = os.getenv("MAILTRAP_PASSWORD")
MAILTRAP_API_TOKEN = os.getenv("MAILTRAP_API_TOKEN")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "buyer@wac.com")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Mock LLM function
def generate_negotiation_email(product_name, supplier, user_request):
    """
    Generate a negotiation email using an LLM.
    In a real implementation, call an LLM API (e.g., Grok, OpenAI).
    """
    company_name = supplier.get("companyName", "Unknown Company")
    supplier_email = supplier.get("email", "info@unknown.com")
    prompt = (
        f"Write a professional negotiation email to a supplier named '{company_name}' "
        f"for the product '{product_name}'. The user wants: {user_request}. "
        f"Address the email to {supplier_email}. Be polite, concise, and professional."
    )

    # Mock response (replace with actual LLM call)
    email_content = (
        f"Subject: Inquiry About {product_name} Pricing and Terms\n\n"
        f"Dear {company_name} Team,\n\n"
        f"I hope this message finds you well. I am reaching out from YourCompany regarding your {product_name} offerings. "
        f"We are interested in {user_request.lower()}. Could you please provide your best pricing, bulk discounts, and delivery terms?\n\n"
        f"Thank you for your time, and I look forward to your response.\n\n"
        f"Best regards,\n supply manager\nNexxaBiz\n{SENDER_EMAIL}"
    )
    return email_content

def send_email(to_email, subject, body):
    """Send email via Mailtrap SMTP."""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(MAILTRAP_SMTP_HOST, MAILTRAP_SMTP_PORT) as server:
            server.starttls()
            server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

def parse_supplier_response(inbox_id="your_inbox_id"):
    """Retrieve and parse supplier responses from Mailtrap inbox."""
    try:
        headers = {"Api-Token": MAILTRAP_API_TOKEN}
        response = requests.get(f"https://mailtrap.io/api/v1/inboxes/{inbox_id}/messages", headers=headers)
        response.raise_for_status()
        messages = response.json()

        for message in messages:
            subject = message.get("subject", "")
            body = message.get("text", "")
            # Simple NLP: Check for keywords like "price", "discount", "delivery"
            if "price" in body.lower() or "discount" in body.lower():
                return {
                    "status": "response_received",
                    "details": f"Supplier responded with: {subject}\n{body[:200]}..."
                }
        return {"status": "no_response", "details": "No relevant supplier responses found."}
    except Exception as e:
        logger.error(f"Error parsing supplier responses: {e}")
        return {"status": "error", "details": str(e)}

##unit testing
import unittest
class TestNegotiationService(unittest.TestCase):
    def test_send_email(self):
        result = send_email("test@example.com", "Test", "Hello")
        self.assertTrue(result)

@app.route("/negotiate", methods=["POST"])
def negotiate():
    """Handle negotiation requests."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        product_name = data.get("product_name", "").strip()
        supplier = data.get("supplier", {})
        user_request = data.get("user_request", "negotiate pricing and terms")

        if not product_name or not supplier.get("email"):
            return jsonify({"error": "Missing product_name or supplier email"}), 400

        # Generate email using LLM
        email_content = generate_negotiation_email(product_name, supplier, user_request)
        subject = f"Inquiry About {product_name} Pricing and Terms"

        # Send email via Mailtrap
        success = send_email(supplier["email"], subject, email_content)
        if not success:
            return jsonify({"error": "Failed to send negotiation email"}), 500

        # Optionally parse supplier responses (for demonstration)
        response_status = parse_supplier_response()

        return jsonify({
            "status": "email_sent",
            "email_content": email_content,
            "response_status": response_status
        })

    except Exception as e:
        logger.error(f"Error in negotiation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5003, debug=False)
