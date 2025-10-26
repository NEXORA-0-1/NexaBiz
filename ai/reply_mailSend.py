import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg['Subject'] = "Re: Jeans Order"
msg['From'] = "info@unknown.com"
msg['To'] = "buyer@wac.com"
msg.set_content("""Hello,

Thank you for reaching out to us at Cambridge Mens & Womans Jeans | Guess Clothing Store. We are pleased to explore a potential partnership with NexxaBiz.

Here is the information you requested:

- Product Catalog: We offer a variety of jeans including skinny, straight, slim, and relaxed fits, in washes such as dark indigo, light blue, black, and distressed. Sizes range from 28 to 40 for men and XS to XL for women.
- Wholesale Pricing: Prices start at $25 per pair. Volume-based discounts are available: 5% off for orders of 100+ units, 10% off for 500+ units, and 15% off for 1000+ units.
- Minimum Order Quantities (MOQs): The MOQ is 50 units per style.
- Lead Times & Delivery: Estimated lead time is 3–4 weeks. We offer both standard and expedited shipping options.
- Payment Terms: Our standard payment terms are 50% upfront and 50% upon delivery. We can also discuss net 30 terms for long-term partners.

We are committed to providing high-quality products and building a lasting business relationship with NexxaBiz.

Best regards,
Supplier
""")

with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
    server.login("c99d7137fa5ecd", "98133aa9d041b5")
    server.send_message(msg)
