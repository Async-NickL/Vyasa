import os
import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold
from utils.gemini import configure_gemini_api
from utils.document_analyzer import extract_text_from_file
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_question_bank(file_path, file_type, file_name):
    """Generate a question bank from document content using Gemini API"""
    file_content = extract_text_from_file(file_path, file_type)
    success, error_message = configure_gemini_api()
    if not success:
        return {"error": f"API Configuration Error: {error_message}"}
    try:  
        generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=4096
        )
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')
        
        prompt = f"""
        You are tasked with creating a comprehensive question bank from the document content provided below.

        DOCUMENT NAME: {file_name}

        CONTENT:
        {file_content}

        TASK INSTRUCTIONS:
        1. Develop a well-structured question bank using Markdown format.
        2. Generate a minimum of 15-20 questions, ensuring a variety of types:
           - Exclude multiple-choice questions (MCQs).
           - Divide questions into three sections: "2 Mark Questions", "4 Mark Questions", and "6 Mark Questions".
           - Provide questions only; do not include answers.
        3. Categorize questions based on the content sections for better organization.
        4. Adhere to proper Markdown formatting, using headers (#) and lists (*).
        5. Assign a difficulty level (Easy, Medium, Hard) to each question and use Roman numerals for indexing.
        6. If the content seems incomplete, indicate that questions are derived from partial content.
        7. Avoid adding any extraneous text such as "Here are the questions" or similar phrases.
        8. Ensure that any URLs provided are in the format without any [],() or kind of bracket.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        if response.text:
            return {"questions": response.text.strip()}
        else:
            return {"error": "Failed to generate questions."}
            
    except Exception as e:
        return {"error": f"Question Generation Error: {str(e)}"} 