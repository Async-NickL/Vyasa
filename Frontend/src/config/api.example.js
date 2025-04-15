// API configuration - EXAMPLE FILE
// Copy this file to api.js and adjust the API_BASE_URL for your environment

// For local development:
// const API_BASE_URL = "http://localhost:5000";

// For production:
const API_BASE_URL = "https://your-backend-url.onrender.com";

export default {
  NOTES_API: `${API_BASE_URL}/api/generate-notes`,
  VISUAL_API: `${API_BASE_URL}/api/generate-visual`,
  DOCUMENT_API: `${API_BASE_URL}/api/analyze-document`,
  ROADMAP_API: `${API_BASE_URL}/api/generate-roadmap`,
  QUESTIONS_API: `${API_BASE_URL}/api/generate-questions`,
}; 