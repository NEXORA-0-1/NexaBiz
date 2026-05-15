from flask import Flask, request, jsonify
from flask_cors import CORS
from ir_model import fix_spelling, get_suggestions
from functools import wraps
import os

app = Flask(__name__)
CORS(app, resources={r"/forecast": {"origins": "http://localhost:3000"}})  # Enable CORS
vocabulary = ["green", "leaves", "demand", "forecast"]

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401
       
        return f(*args, **kwargs)
    return decorated_function

@app.route('/suggest', methods=['GET'])
def suggest():
    try:
        query = request.args.get('q', '')
        suggestions = get_suggestions(query, vocabulary)
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/forecast', methods=['POST'])
@require_auth
def forecast():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "No query provided"}), 400
        query = data['query']
        fixed_query = fix_spelling(query, vocabulary)
        if fixed_query in vocabulary:
            return jsonify({"forecast": f"Data for {fixed_query}"})
        return jsonify({"error": "No forecast"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)