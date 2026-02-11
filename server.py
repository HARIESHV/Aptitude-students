from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import json
import os

app = Flask(__name__)
CORS(app)

# Database Configuration
# UPDATE THESE TO YOUR ACTUAL MYSQL CREDENTIALS
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'yourpassword'),
    'database': os.getenv('MYSQL_DATABASE', 'aptimaster')
}

# --- Safe-Mode Fallback Logic ---
# This allows the app to run even if MySQL is not yet configured
DUMMY_QUESTIONS = [
    {
        "id": 1,
        "text": "If 5 workers can build a wall in 12 days, how many workers are needed to build it in 4 days?",
        "category": "Quantitative",
        "options": ["10", "15", "20", "25"],
        "correctAnswer": 1,
        "explanation": "Inverse proportion: 5 * 12 = X * 4. X = 60 / 4 = 15."
    }
]

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"⚠️ DATABASE CONNECTION FAILED: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "database": "connected" if get_db_connection() else "disconnected"})

@app.route('/api/state', methods=['GET'])
def get_state():
    db = get_db_connection()
    if not db:
        return jsonify({
            "questions": DUMMY_QUESTIONS,
            "submissions": [],
            "mode": "SAFE_MODE_NO_DB"
        })
    
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM questions")
        questions = cursor.fetchall()
        
        # Ensure options is a list if it was stored as JSON string
        for q in questions:
            if isinstance(q['options'], str):
                q['options'] = json.loads(q['options'])
        
        db.close()
        return jsonify({
            "questions": questions,
            "submissions": []
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questions', methods=['POST'])
def add_question():
    data = request.json
    db = get_db_connection()
    if not db:
        DUMMY_QUESTIONS.append(data)
        return jsonify({"status": "ok", "mode": "memory_storage"})
    
    try:
        cursor = db.cursor()
        query = """INSERT INTO questions 
                   (text, category, options, correctAnswer, difficulty, timeLimitMinutes, explanation) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        values = (
            data['text'],
            data['category'],
            json.dumps(data['options']),
            data['correctAnswer'],
            data['difficulty'],
            data['timeLimitMinutes'],
            data['explanation']
        )
        cursor.execute(query, values)
        db.commit()
        db.close()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/questions/<id>', methods=['DELETE'])
def delete_question(id):
    db = get_db_connection()
    if not db:
        # Simple ID filtering for dummy data
        global DUMMY_QUESTIONS
        DUMMY_QUESTIONS = [q for q in DUMMY_QUESTIONS if str(q.get('id')) != str(id)]
        return jsonify({"status": "ok"})
    
    try:
        cursor = db.cursor()
        cursor.execute("DELETE FROM questions WHERE id = %s", (id,))
        db.commit()
        db.close()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 AptiMaster Python Backend starting on port 5000...")
    app.run(port=5000, debug=True)