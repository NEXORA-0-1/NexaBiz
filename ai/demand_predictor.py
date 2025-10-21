import spacy
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import pickle
import logging
import os
from dotenv import load_dotenv
from rapidfuzz import process, fuzz
import google.generativeai as genai

# ------------------ Load environment variables ------------------
load_dotenv()
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=gemini_api_key)

# ------------------ Logging ------------------
logging.basicConfig(filename='demand_predictor_logs.txt', level=logging.INFO)

# ------------------ Load spaCy NLP model ------------------
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    logging.error(f"Failed to load spaCy model: {e}")
    raise

# ------------------ Safe paths for model and columns ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'demand_predictor_model.pkl')
COLUMNS_PATH = os.path.join(BASE_DIR, 'columns.pkl')

# Load trained LightGBM model
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train the model first.")
model = joblib.load(MODEL_PATH)

# Load preprocessing columns
if not os.path.exists(COLUMNS_PATH):
    raise FileNotFoundError(f"Columns file not found at {COLUMNS_PATH}. Save columns after training.")
with open(COLUMNS_PATH, 'rb') as f:
    model_columns = pickle.load(f)

# ------------------ Flask app ------------------
app = Flask(__name__)

# ------------------ Utility functions ------------------
def normalize_name(name: str) -> str:
    return name.strip().lower() if isinstance(name, str) else ""

def fuzzy_match_product(product_norm, product_list, threshold=70):
    if not product_list:
        return None
    best_match = process.extractOne(product_norm, product_list, scorer=fuzz.WRatio)
    if best_match and best_match[1] >= threshold:
        return best_match[0]
    return None

# ------------------ Predict demand endpoint ------------------
@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        data = request.json
        query = data.get('query')
        stock_data = data.get('stock_data')
        transaction_data = data.get('transaction_data')
        logging.info(f"Received: query={query}, stock_data={stock_data}, transaction_data={transaction_data}")

        if not query or not stock_data or not transaction_data:
            return jsonify({'error': 'Missing required data'}), 400

        # Extract product and period
        doc = nlp(query)
        product = next((ent.text for ent in doc.ents if ent.label_ == 'PRODUCT'), None)
        if not product:
            product = query.lower().replace('predict demand for', '').replace('next month', '').strip()
        period = next((ent.text for ent in doc.ents if ent.label_ in ['DATE', 'TIME']), 'month')
        product_norm = normalize_name(product)

        # Convert input to DataFrames
        df_stock = pd.DataFrame(stock_data)
        df_transactions = pd.DataFrame([item for t in transaction_data for item in t['items']]) if transaction_data else pd.DataFrame()

        # Normalize product names
        if not df_stock.empty and 'product_name' in df_stock.columns:
            df_stock['product_name_norm'] = df_stock['product_name'].apply(normalize_name)
        if not df_transactions.empty and 'product_name' in df_transactions.columns:
            df_transactions['product_name_norm'] = df_transactions['product_name'].apply(normalize_name)

        # Fuzzy match if needed
        matched_product_name = None
        if not df_stock.empty:
            # Check exact match first
            if product_norm in df_stock['product_name_norm'].values:
                matched_product_name = df_stock[df_stock['product_name_norm'] == product_norm]['product_name'].iloc[0]
            else:
                # Fuzzy match
                product_norm_fuzzy = fuzzy_match_product(product_norm, df_stock['product_name_norm'].tolist())
                if product_norm_fuzzy:
                    matched_product_name = df_stock[df_stock['product_name_norm'] == product_norm_fuzzy]['product_name'].iloc[0]
                else:
                    return jsonify({'error': f'Product {product} not found in stock'}), 400


        # Extract current stock
        if matched_product_name:
            matched_norm = normalize_name(matched_product_name)
            current_stock = int(df_stock[df_stock['product_name_norm'] == matched_norm]['qty'].iloc[0])
        else:
            current_stock = 0


        # Aggregate past sales
        product_sales = int(df_transactions[df_transactions['product_name_norm'] == matched_norm]['qty'].sum())
        total_sales = int(df_transactions['qty'].sum()) if not df_transactions.empty else 1
        sales_ratio = product_sales / total_sales

        # Prepare features for model
        # ------------------ Prepare features for model (REPLACE THIS BLOCK) ------------------

        # Start with zeros for all model columns
        X_new = pd.DataFrame([{col: 0 for col in model_columns}])

        # Safety: ensure matched_norm exists
        matched_norm = normalize_name(matched_product_name) if matched_product_name else None

        # Get the product row from df_stock using matched_norm if available
        product_row = None
        if matched_norm is not None and not df_stock.empty:
            rows = df_stock[df_stock['product_name_norm'] == matched_norm]
            if not rows.empty:
                product_row = rows.iloc[0]

        # 1) Fill numeric features from product_row (Firestore fields)
        if product_row is not None:
            # price_per_unit_usd: use suggested_price_usd, fallback to base_cost_usd or last selling price
            if 'suggested_price_usd' in product_row and pd.notna(product_row['suggested_price_usd']):
                X_new.at[0, 'price_per_unit_usd'] = float(product_row['suggested_price_usd'])
            elif 'base_cost_usd' in product_row and pd.notna(product_row['base_cost_usd']):
                X_new.at[0, 'price_per_unit_usd'] = float(product_row['base_cost_usd'])
            
            # base_cost_usd and suggested_price_usd
            if 'base_cost_usd' in product_row and pd.notna(product_row['base_cost_usd']):
                X_new.at[0, 'base_cost_usd'] = float(product_row['base_cost_usd'])
            if 'suggested_price_usd' in product_row and pd.notna(product_row['suggested_price_usd']):
                X_new.at[0, 'suggested_price_usd'] = float(product_row['suggested_price_usd'])
            
            # material_per_unit_kg
            if 'material_per_unit_kg' in product_row and pd.notna(product_row['material_per_unit_kg']):
                X_new.at[0, 'material_per_unit_kg'] = float(product_row['material_per_unit_kg'])
            
            # Use stock amount -> map to an inventory related numeric (we do not know exact expected feature, leaving base_cost_usd used above;
            # if you have 'stock_amount' column, map it to a feature you trained on; otherwise keep current_stock as separate)
            if 'stock_amount' in product_row and pd.notna(product_row['stock_amount']):
                current_stock = int(product_row['stock_amount'])
            elif 'qty' in product_row and pd.notna(product_row['qty']):
                current_stock = int(product_row['qty'])
            # (current_stock variable already exists but we ensure it's consistent)
            X_new.at[0, 'base_cost_usd'] = X_new.at[0, 'base_cost_usd']  # keep value already assigned

            # One-hot category
            cat = product_row.get('category') if 'category' in product_row else None
            if isinstance(cat, str):
                col = f"category_{cat}"
                if col in model_columns:
                    X_new.at[0, col] = 1

            # One-hot material_type
            mat = product_row.get('material_type') if 'material_type' in product_row else None
            if isinstance(mat, str):
                col = f"material_type_{mat}"
                if col in model_columns:
                    X_new.at[0, col] = 1

            # Product id -> map to product_id_* one-hot (product_id expected in product_row)
            pid = product_row.get('product_id') if 'product_id' in product_row else None
            if isinstance(pid, str):
                pid_col = f"product_id_{pid}"
                if pid_col in model_columns:
                    X_new.at[0, pid_col] = 1

        # 2) Compute price/discount info from transaction history (if available)
        # df_transactions was flattened earlier to per-item rows with 'product_name' and 'qty', maybe 'selling_price' and 'discount'
        if not df_transactions.empty and matched_norm is not None:
            # Filter transactions for this product
            trans_for_prod = df_transactions[df_transactions['product_name_norm'] == matched_norm]
            if not trans_for_prod.empty:
                # price: mean selling_price if present
                if 'selling_price' in trans_for_prod.columns:
                    try:
                        X_new.at[0, 'price_per_unit_usd'] = float(trans_for_prod['selling_price'].mean())
                    except Exception:
                        pass
                # discount_percent: if 'discount' column exists and likely percent (0-100) else compute from subtotal/selling_price
                if 'discount' in trans_for_prod.columns:
                    # Use mean of discount values; if they look like absolute amounts, convert to percent if selling_price present
                    avg_disc = trans_for_prod['discount'].mean()
                    if 'selling_price' in trans_for_prod.columns and avg_disc > 0:
                        # If discount seems small (<1) treat as fraction; if >1 and <=100 treat as percent; otherwise compute rough percent
                        if avg_disc <= 1:
                            X_new.at[0, 'discount_percent'] = float(avg_disc * 100)
                        elif avg_disc <= 100:
                            X_new.at[0, 'discount_percent'] = float(avg_disc)
                        else:
                            # fallback: estimate percent by comparing subtotal vs qty*selling_price (rare)
                            try:
                                estimated = (1 - (trans_for_prod['subtotal'].sum() / (trans_for_prod['selling_price'] * trans_for_prod['qty']).sum())) * 100
                                X_new.at[0, 'discount_percent'] = float(max(0, estimated))
                            except Exception:
                                X_new.at[0, 'discount_percent'] = float(min(avg_disc, 100))
                elif 'discount_percent' in trans_for_prod.columns:
                    X_new.at[0, 'discount_percent'] = float(trans_for_prod['discount_percent'].mean())

        # 3) External/time features: infer date from latest transaction if available, otherwise use now
        from datetime import datetime
        if not df_transactions.empty and 'createdAt' in df_transactions.columns:
            # use the most recent transaction timestamp for temporal features
            try:
                # try parse createdAt if string timestamps exist
                latest_ts = pd.to_datetime(df_transactions['createdAt']).max()
                now = latest_ts.to_pydatetime()
            except Exception:
                now = datetime.now()
        else:
            now = datetime.now()

        X_new.at[0, 'day_of_week'] = int(now.weekday())
        X_new.at[0, 'month'] = int(now.month)
        X_new.at[0, 'year'] = int(now.year)

        # 4) Location and business_type if passed in top-level data or product_row
        if 'business_type' in data:
            bt_col = f"business_type_{data['business_type']}"
            if bt_col in model_columns:
                X_new.at[0, bt_col] = 1
        elif product_row is not None and 'business_type' in product_row:
            bt_col = f"business_type_{product_row['business_type']}"
            if bt_col in model_columns:
                X_new.at[0, bt_col] = 1

        # location: try top-level data, then product_row
        if 'location' in data:
            loc_col = f"location_{data['location']}"
            if loc_col in model_columns:
                X_new.at[0, loc_col] = 1
        elif product_row is not None and 'location' in product_row:
            loc_col = f"location_{product_row['location']}"
            if loc_col in model_columns:
                X_new.at[0, loc_col] = 1

        # 5) fill regionals/external numeric features if provided in data (e.g., from external API)
        # If your frontend sends external_factors in request, map them here
        external = data.get('external_factors', {}) or {}
        # Map common externals if present
        for k in ['avg_temp_c','precip_flag','holiday_flag','usd_to_local','inflation_index']:
            if k in external and f"{k}" in model_columns:
                try:
                    X_new.at[0, k] = float(external[k])
                except Exception:
                    pass

        # 6) Ensure current_stock and 'past_sales' or ratio are represented if model expects such fields:
        # (Your model doesn't have a 'current_stock' column; we have used base_cost_usd as placeholder earlier if needed. If you trained with current_stock, include here.)
        # If your trained model expects 'past_sales' or similar, set them:
        if 'past_sales' in model_columns:
            X_new.at[0, 'past_sales'] = int(product_sales)
        # if percent ratio feature exists with another name, map accordingly
        if 'product_sales_ratio' in model_columns:
            X_new.at[0, 'product_sales_ratio'] = float(sales_ratio)

        # 7) Final alignment: ensure all columns exist in same order + type consistency
        X_new = X_new.reindex(columns=model_columns, fill_value=0)

        # 8) Log only non-zero features cleanly
        feature_values = X_new.to_dict(orient='records')[0]
        logging.info("----- MODEL INPUT FEATURES START -----")
        for feature, value in feature_values.items():
            if value != 0:
                logging.info(f"{feature}: {value}")
        logging.info("----- MODEL INPUT FEATURES END -----")
        # ------------------ End feature block ------------------


        # Debug Logging – Confirm Model + Inputs
        logging.info(f"Using model type: {type(model)}")
        logging.info(f"Model input features: {X_new.to_dict(orient='records')}")
        future_demand_raw = model.predict(X_new)[0]
        logging.info(f"Raw model prediction output: {future_demand_raw}")

        # Predict demand
        future_demand = int(max(0, model.predict(X_new)[0]))

        # Gemini insight
        prompt = f"Based on current stock {current_stock}, past sales {product_sales} for {product}, predict demand for {period}. Keep it concise."
        try:
            model_gemini = genai.GenerativeModel("gemini-2.0-flash-001")
            response = model_gemini.generate_content(prompt)
            insight = response.text
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            insight = "Unable to generate insight due to API error."

        # Return summary
        readable_text = (
            f"🌿 Nexabiz AI Forecast:\n"
            f"For {matched_product_name} {period}, you currently have {current_stock} in stock.\n"
            f"Last month you sold {product_sales} units.\n"
            f"We predict you'll need {future_demand} units.\n"
            f"{insight}"
        )

        logging.info({
            'product': product,
            'period': period,
            'current_stock': current_stock,
            'past_sales': product_sales,
            'forecast_demand': future_demand,
            'insight': insight
        })

        return jsonify({'readable_text': readable_text})

    except Exception as e:
        logging.error(f"Error in predict_demand: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
