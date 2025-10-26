from serpapi import GoogleSearch
import time
import requests
from bs4 import BeautifulSoup
import re
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file
serpapi_key = os.getenv("SERPAPI_API_KEY")
if not serpapi_key:
    raise ValueError("SERPAPI_API_KEY not found in environment variables.")

# Regex patterns for email and phone number extraction
EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
PHONE_REGEX = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'

def scrape_website_for_contact(url):
    """Scrape a website for email and phone number."""
    try:
        # Send request with a user-agent to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract all text from the page
        text = soup.get_text(separator=' ', strip=True)

       # Find emails in text
        emails = list(set(re.findall(EMAIL_REGEX, text)))

        # Find emails in mailto links
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').strip()
                if re.match(EMAIL_REGEX, email):
                    emails.append(email)
        email = emails[0] if emails else None

        # Find phone numbers in text
        phones = list(set(re.findall(PHONE_REGEX, text)))

        # Find phone numbers in tel links
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('tel:'):
                phone = href.replace('tel:', '').strip()
                phones.append(phone)
        phone = phones[0] if phones else None

        # If no email or phone found, try finding a "Contact Us" page
        if not email or not phone:
            contact_links = soup.find_all('a', href=re.compile(r'(contact|about|support)', re.I))
            for link in contact_links[:2]:  # Limit to 2 links to avoid excessive requests
                contact_url = link.get('href')
                if contact_url:
                    # Handle relative URLs
                    if not contact_url.startswith('http'):
                        from urllib.parse import urljoin
                        contact_url = urljoin(url, contact_url)
                    try:
                        contact_response = requests.get(contact_url, headers=headers, timeout=5)
                        contact_response.raise_for_status()
                        contact_soup = BeautifulSoup(contact_response.text, 'html.parser')
                        contact_text = contact_soup.get_text(separator=' ', strip=True)

                        # Check for emails
                        if not email:
                            contact_emails = list(set(re.findall(EMAIL_REGEX, contact_text)))
                            for a_tag in contact_soup.find_all('a', href=True):
                                if a_tag['href'].startswith('mailto:'):
                                    contact_email = a_tag['href'].replace('mailto:', '').strip()
                                    if re.match(EMAIL_REGEX, contact_email):
                                        contact_emails.append(contact_email)
                            email = contact_emails[0] if contact_emails else None

                        # Check for phone numbers
                        if not phone:
                            contact_phones = list(set(re.findall(PHONE_REGEX, contact_text)))
                            for a_tag in contact_soup.find_all('a', href=True):
                                if a_tag['href'].startswith('tel:'):
                                    contact_phone = a_tag['href'].replace('tel:', '').strip()
                                    contact_phones.append(contact_phone)
                            phone = contact_phones[0] if contact_phones else None
                    except requests.exceptions.RequestException as e:
                        print(f"Error scraping contact page {contact_url}: {e}")

        return email or "info@unknown.com", phone or "N/A"
    except requests.exceptions.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return "info@unknown.com", "N/A"
    
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
                url = result.get('link', '')
                # Scrape website for contact details
                email, phone = scrape_website_for_contact(url) if url else ("info@unknown.com", "N/A")
                suppliers.append({
                    "name": result.get('title', 'Unknown Supplier'),
                    "url": url,
                    "details": result.get('snippet', ''),
                    "rating": result.get('rating', 'N/A'),
                    "email": email,
                    "phone": phone
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
            "email": s.get("email", "info@unknown.com"),
            "contact": s.get("phone", "N/A"),
            "description": s.get("details", ""),
            "website": s.get("url", "")
        })
    return formatted
