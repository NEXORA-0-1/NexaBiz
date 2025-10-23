# ai_agents/trend_analyzer.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import IsolationForest
from prophet import Prophet
from pytrends.request import TrendReq
import pandas as pd
import numpy as np
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
from datetime import timedelta

# -------- Logging & env --------
logging.basicConfig(filename='trend_analyzer_logs.txt', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s %(message)s')
load_dotenv()
GEMINI_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_KEY:
    raise ValueError("GEMINI_API_KEY missing in .env")
genai.configure(api_key=GEMINI_KEY)
GEMINI_MODEL = "gemini-2.0-flash-001"

# -------- Flask --------
app = Flask(__name__)
CORS(app)

# -------- Helpers --------
def flatten_transactions(transaction_data):
    rows = []
    for t in transaction_data:
        created = t.get("createdAt") or t.get("created_at") or None
        try:
            date = pd.to_datetime(created)
        except Exception:
            date = pd.Timestamp.now()
        for item in t.get("items", []):
            rows.append({
                "date": date,
                "product": item.get("product_name", "Unknown"),
                "qty": float(item.get("qty", 0))
            })
    df = pd.DataFrame(rows)
    if df.empty:
        return pd.DataFrame(columns=["date","product","qty"])
    df = df.groupby([pd.Grouper(key="date", freq="D"), "product"]).sum().reset_index()
    return df

def analyze_internal_trend(prod_df):
    # prod_df: ds (date) & y (qty)
    insights = []
    try:
        m = Prophet(daily_seasonality=False, weekly_seasonality=True)
        m.fit(prod_df.rename(columns={"date":"ds","qty":"y"}))
        future = m.make_future_dataframe(periods=14)  # 14 days forecast
        forecast = m.predict(future)
        # Compare last 7 vs prior 7
        recent = forecast.tail(14).reset_index(drop=True)
        last7 = recent['yhat'].tail(7).mean()
        prev7 = recent['yhat'].head(7).mean()
        pct_change = ((last7 - prev7) / prev7 * 100) if prev7 != 0 else 0
        if pct_change > 10:
            insights.append(f"📈 Sales estimated up {pct_change:.1f}% vs previous week.")
        elif pct_change < -10:
            insights.append(f"📉 Sales estimated down {abs(pct_change):.1f}% vs previous week.")
        else:
            insights.append("🔁 Sales are stable in the last period.")
    except Exception as e:
        logging.warning("Prophet failed: %s", e)
        insights.append("⚠️ Could not compute robust forecast for this product.")
    return insights

def detect_anomalies(series):
    if len(series) < 5:
        return []  # not enough data
    try:
        iso = IsolationForest(contamination=0.05, random_state=42)
        arr = np.array(series).reshape(-1,1)
        preds = iso.fit_predict(arr)
        anomalies_idx = np.where(preds == -1)[0]
        return anomalies_idx.tolist()
    except Exception as e:
        logging.warning("Anomaly detection failed: %s", e)
        return []

def get_google_trends(keywords, geo="US", timeframe="now 7-d"):
    results = {}
    try:
        pytrends = TrendReq(hl='en-US', tz=0)
        for k in keywords:
            try:
                pytrends.build_payload([k], timeframe=timeframe, geo=geo)
                data = pytrends.interest_over_time()
                if data.empty:
                    results[k] = None
                else:
                    series = data[k]
                    change = 0
                    if len(series) >= 8:
                        latest = series.iloc[-1]
                        prev_avg = series.iloc[-8:-1].mean()
                        change = ((latest - prev_avg) / prev_avg * 100) if prev_avg != 0 else 0
                    results[k] = {"latest": int(series.iloc[-1]), "pct_change": round(change,1)}
            except Exception as e:
                logging.info("pytrends error for %s: %s", k, e)
                results[k] = None
    except Exception as e:
        logging.info("pytrends global error: %s", e)
        for k in keywords:
            results[k] = None
    return results

def summarize_with_gemini(insights_list):
    prompt = "You are an assistant for an e-commerce operator. Summarize the findings below in short actionable business language (2-4 sentences):\n\n"
    prompt += "\n".join(insights_list)
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        logging.error("Gemini summarization failed: %s", e)
        return "Summary unavailable due to AI error."

# -------- Endpoint --------
@app.route("/analyze_trends", methods=["POST"])
def analyze_trends():
    try:
        data = request.get_json() or {}
        transaction_data = data.get("transaction_data", [])
        geo = data.get("geo", "US")  # optional geolocation for Google Trends
        df = flatten_transactions(transaction_data)
        if df.empty:
            return jsonify({"insights":[],"summary":"No transaction data provided."})

        insights = []
        # choose top N products by total sales to analyze
        prod_totals = df.groupby("product")["qty"].sum().sort_values(ascending=False)
        top_products = prod_totals.head(10).index.tolist()

        # analyze each top product
        for product in top_products:
            prod_df = df[df["product"] == product].copy().sort_values("date")
            # Basic stats
            total = prod_df["qty"].sum()
            last_date = prod_df["date"].max().date()
            insights.append(f"🔎 Product: '{product}' — total sold: {int(total)} (last sale: {last_date})")

            # Trend analysis (Prophet)
            trend_notes = analyze_internal_trend(prod_df.rename(columns={"date":"ds","qty":"y"}))
            for n in trend_notes:
                insights.append(f"{product}: {n}")

            # Anomaly detection
            anomalies = detect_anomalies(prod_df["qty"].values)
            if anomalies:
                # map indices -> dates
                try:
                    anomaly_dates = [str(prod_df.iloc[i]["date"].date()) for i in anomalies if i < len(prod_df)]
                    insights.append(f"⚠️ Detected {len(anomalies)} anomalous day(s) for '{product}': {', '.join(anomaly_dates)}")
                except Exception:
                    insights.append(f"⚠️ Detected anomalies for '{product}' (dates unavailable).")

        # External trends via Google Trends
        ext = get_google_trends(top_products, geo=geo, timeframe="now 7-d")
        for p, val in ext.items():
            if val is None:
                insights.append(f"{p}: No public search trend data available.")
            else:
                if val["pct_change"] > 10:
                    insights.append(f"🌍 Public interest in '{p}' rose by {val['pct_change']}% in the last week.")
                elif val["pct_change"] < -10:
                    insights.append(f"🌍 Public interest in '{p}' dropped by {abs(val['pct_change'])}% in the last week.")
                else:
                    insights.append(f"🌍 Public interest for '{p}' is steady.")

        # Gemini summarize
        summary = summarize_with_gemini(insights)

        return jsonify({"insights": insights, "summary": summary})
    except Exception as e:
        logging.exception("Error in /analyze_trends:")
        return jsonify({"error": str(e)}), 500

# -------- Run --------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5004, debug=True)
