# Vyasa: Helping Hand to Students

Vyasa is an AI-powered educational platform designed to assist students in their learning journey. It provides tools for generating educational notes, analyzing documents, creating personalized learning roadmaps, generating question banks, and producing visual explanations of concepts.

## Project Structure

The project consists of two main components:

- **Backend**: A Flask API that powers the AI features using Google's Gemini models
- **Frontend**: A React-based web application that provides the user interface

## Features

- **Educational Notes Generation**: Convert YouTube videos into comprehensive educational notes
- **Document Analysis**: Extract and analyze content from various document formats (PDF, DOCX, TXT, Excel)
- **Learning Roadmap Generation**: Create personalized learning roadmaps for any topic
- **Question Bank Generation**: Generate practice questions from educational content
- **Visual Concept Explanation**: Create visual explanations of complex topics

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- Google Gemini API key

### Backend Setup

1. Navigate to the Backend directory:
   ```
   cd Python/Backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file with the following content:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   DEBUG=True
   PORT=5000
   ```

6. Start the backend server:
   ```
   python app.py
   ```

### Frontend Setup

1. Navigate to the Frontend directory:
   ```
   cd Python/Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Security Note

This project uses environment variables for configuration. The `.env` file containing sensitive information like API keys is included in `.gitignore` to prevent accidental exposure. Never commit the `.env` file to version control.

## Acknowledgments

- This project uses Google's Gemini AI models for content generation
- Built with Flask, React, and various open-source libraries 