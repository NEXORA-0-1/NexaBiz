import google.generativeai as genai

# Configure your API key
genai.configure(api_key="AIzaSyAW0WxRQxaXL8nD7R41Su2HS1w9Wdy6HBg")

# Choose a model that exists in your list
model = genai.GenerativeModel("gemini-2.0-flash-001")  # pick any from the list

# Generate content
resp = model.generate_content("Say hello in one line")
print(resp.text)
