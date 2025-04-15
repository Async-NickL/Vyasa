from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import os
import tempfile
from dotenv import load_dotenv
from utils.gemini import generate_educational_notes, generate_context_image
from utils.document_analyzer import extract_text_from_file, analyze_document_content
from utils.roadmap_generator import DynamicLearningRoadmapGenerator
from utils.question_generator import generate_question_bank
from utils.image_generator import generate_image_from_notes

# Load environment variables
load_dotenv()

# Define allowed origins at module level so it's accessible in all functions
allowed_origins = [
    "https://vyasa.netlify.app",
    "http://vyasa.netlify.app"
]

app = Flask(__name__)

# Configure CORS with more explicit settings
if os.getenv('DEBUG', 'True').lower() == 'true':
    # In development, allow all origins with more permissive settings
    CORS(app, 
         resources={r"/*": {
             "origins": "*",
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": False,
             "max_age": 3600
         }}
    )
else:
    # In production, only allow specific origins with explicit settings
    CORS(app, 
         resources={r"/*": {
             "origins": allowed_origins,
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": False,
             "max_age": 3600,
             "expose_headers": ["Content-Type", "Content-Length"]
         }}
    )

# Add a route specifically for handling OPTIONS requests (preflight)
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return jsonify({}), 200

@app.route('/')
def index():
    return jsonify({"message": "Hello World"})

@app.route('/api/generate-notes', methods=['POST'])
def generate_notes():
    data = request.json
    youtube_url = data.get('youtube_url')
    print(youtube_url)
    if not youtube_url:
        return jsonify({"error": "Missing youtube_url parameter"}), 400
    try:
        notes = generate_educational_notes(youtube_url)
        return jsonify({"notes": notes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        file.save(temp_file_path)
        file_content = extract_text_from_file(temp_file_path, file.content_type)
        result = analyze_document_content(file_content, file.filename)
        os.remove(temp_file_path)
        os.rmdir(temp_dir)
        return jsonify(result)
        
    except Exception as e:
        # Clean up in case of error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)
        
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500

@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap():
    data = request.json
    topic = data.get('topic')
    
    if not topic:
        return jsonify({"error": "Missing topic parameter"}), 400
    
    try:
        roadmap_generator = DynamicLearningRoadmapGenerator()
        roadmap = roadmap_generator.generate_comprehensive_roadmap(topic)
        return jsonify(roadmap)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, file.filename)
        file.save(temp_path)
        result = generate_question_bank(temp_path, file.content_type, file.filename)
        os.remove(temp_path)
        os.rmdir(temp_dir)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-visual', methods=['POST'])
def generate_visual():
    try:
        data = request.get_json()
        if not data or 'notes_content' not in data:
            return jsonify({"error": "Notes content is required"}), 400
        
        notes_content = data['notes_content']
        image_data, error = generate_image_from_notes(notes_content)
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify(image_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a global after_request handler to ensure CORS headers
@app.after_request
def after_request(response):
    if os.getenv('DEBUG', 'True').lower() == 'true':
        # In development, allow all origins
        response.headers.add('Access-Control-Allow-Origin', '*')
    else:
        # Check if the request's origin is in our allowed origins
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
    
    # Add other CORS headers
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'false')
    return response

if __name__ == '__main__':
    # Get the PORT from environment variable (provided by Render)
    port = int(os.environ.get("PORT", 5000))
    
    # Make sure to bind to 0.0.0.0 so Render can detect the open port
    app.run(
        host="0.0.0.0",
        port=port,
        debug=os.getenv("DEBUG", "True").lower() == "true"
    )