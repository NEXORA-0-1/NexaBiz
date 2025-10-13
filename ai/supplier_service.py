from serpapi import GoogleSearch
import time
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
serpapi_key = os.getenv("SERPAPI_API_KEY")
if not serpapi_key:
    raise ValueError("SERPAPI_API_KEY not found in environment variables.")

def get_web_suppliers(product_name):
    try:
        params = {
            "q": f"{product_name} suppliers near me",
            "api_key": serpapi_key,
            "num": 5
        }
        search = GoogleSearch(params)
        results = search.get_dict()

        suppliers = []
        if 'organic_results' in results:
            for result in results['organic_results']:
                suppliers.append({
                    "name": result.get('title', 'Unknown Supplier'),
                    "url": result.get('link', ''),
                    "details": result.get('snippet', ''),
                    "rating": result.get('rating', 'N/A')  # If available
                })

        # Rate limit (1 req/sec)
        time.sleep(1)
        return suppliers
    except requests.exceptions.RequestException as e:
        print("serpAPI error:", e)
        return [{"name": "Error fetching suppliers", "url": "", "details": str(e)}]

def format_suppliers(suppliers):
    formatted = []
    for s in suppliers:
        formatted.append({
            "companyName": s.get("name", "Unknown Company"),
            "owner": "Not listed",  # You can later scrape or infer this
            "email": "info@unknown.com",  # Placeholder (use regex to extract emails if available)
            "contact": "N/A",
            "description": s.get("details", ""),
            "website": s.get("url", "")
        })
    return formatted

