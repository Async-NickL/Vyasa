import os
import tempfile
import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold
import PyPDF2
import docx
import pandas as pd
from utils.gemini import configure_gemini_api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        return text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def extract_text_from_docx(file_path):
    """Extract text from a Word document"""
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        return f"Error extracting text from Word document: {str(e)}"

def extract_text_from_excel(file_path):
    """Extract text from an Excel file"""
    try:
        df = pd.read_excel(file_path)
        return df.to_string(index=False)
    except Exception as e:
        return f"Error extracting text from Excel file: {str(e)}"

def extract_text_from_txt(file_path):
    """Extract text from a text file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
        except Exception as e:
            return f"Error extracting text from text file: {str(e)}"
    except Exception as e:
        return f"Error extracting text from text file: {str(e)}"

def extract_text_from_file(file_path, file_type):
    """Extract text from a file based on its type"""
    if file_type == 'application/pdf':
        return extract_text_from_pdf(file_path)
    elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        return extract_text_from_docx(file_path)
    elif file_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
        return extract_text_from_excel(file_path)
    elif file_type == 'text/plain':
        return extract_text_from_txt(file_path)
    else:
        return "Unsupported file type"

def analyze_document_content(file_content, file_name):
    """Generate a summary and analysis of document content using Gemini API"""
    success, error_message = configure_gemini_api()
    if not success:
        return {"error": f"API Configuration Error: {error_message}"}
    
    try:  
        generation_config = GenerationConfig(
            temperature=0.2,
            top_p=0.95,
            top_k=40,
            max_output_tokens=4096
        )
        
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
        
        model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')
        
        prompt = f"""
        Create a comprehensive summary and analysis of the following document content:
        
        DOCUMENT NAME: {file_name}
        
        CONTENT:
        {file_content}
        
        INSTRUCTIONS:
        1. Create a well-structured summary in Markdown format
        2. Organize with clear headings, subheadings, bullet points, and concise paragraphs
        3. Include key points, main arguments, important data, and significant findings
        4. Identify the main themes and concepts
        5. Use proper Markdown formatting (headers with #, lists with *, etc.)
        6. If the content appears to be truncated, note that the analysis is based on partial content
        7. Be factual and objective - only include information that can be directly inferred from the provided content
        8. don't add any other text except the summary like "Okay here is the summary" or anything like that
        """
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        if response.text:
            return {"summary": response.text.strip()}
        else:
            return {"error": "Failed to generate document analysis."}
            
    except Exception as e:
        return {"error": f"Analysis Error: {str(e)}"} 