import base64
import os
import mimetypes
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def configure_image_generation():
    """Configure the Gemini API for image generation"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return False, "API key not found. Make sure the GEMINI_API_KEY is set in the .env file."
        
        genai.configure(api_key=api_key)
        return True, None
    except Exception as e:
        return False, str(e)

def save_binary_file(file_name, data):
    """Helper function to save binary data to a file"""
    f = open(file_name, "wb")
    f.write(data)
    f.close()

def generate_image_from_notes(notes_content):
    """Generate an image based on notes content using Gemini API"""
    try:
        success, error = configure_image_generation()
        if not success:
            return None, error
        
        # Configure the image generation model
        generation_config = {
            "temperature": 0.4,
            "top_p": 1,
            "top_k": 32,
            "max_output_tokens": 4096
        }
        
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        
        # Using original model name
        print(f"Attempting to generate image with gemini-2.0-flash-exp-image-generation...")
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp-image-generation",
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        prompt = f"""Generate a clear educational diagram visualizing this concept:

{notes_content}

The diagram should be:
- Clear and professional with labeled components
- Using high contrast, accessible colors
- Immediately understandable with minimal text
- Accurate with properly connected elements
- Suitable for students to understand the concept at a glance
"""
        
        try:
            response = model.generate_content(prompt)
            
            print(f"Response type: {type(response)}")
            print(f"Has text attribute: {hasattr(response, 'text')}")
            print(f"Has candidates: {hasattr(response, 'candidates')}")
            
            # Check if the response has the expected structure
            if hasattr(response, 'candidates') and len(response.candidates) > 0:
                if hasattr(response.candidates[0], 'content'):
                    if hasattr(response.candidates[0].content, 'parts'):
                        parts = response.candidates[0].content.parts
                        for part in parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                return {
                                    "success": True,
                                    "image_data": base64.b64encode(part.inline_data.data).decode('utf-8'),
                                    "mime_type": part.inline_data.mime_type
                                }, None
            
            # If we've reached here, try the alternative image generation
            return generate_alternative_image(notes_content)
            
        except Exception as e:
            print(f"First attempt failed: {str(e)}")
            return generate_alternative_image(notes_content)
            
    except Exception as e:
        print(f"Error in generate_image_from_notes: {str(e)}")
        return None, f"Error generating image: {str(e)}"

def generate_alternative_image(notes_content):
    """Alternative approach using the image generation specific model"""
    try:
        # Using original model name
        print(f"Attempting with imagegeneration@002...")
        model = genai.GenerativeModel("imagegeneration@002")
        
        prompt = f"""Create a detailed educational diagram visualizing: {notes_content}
        Make it clear, labeled, and visually intuitive for education purposes."""
        
        response = model.generate_content(prompt)
        
        print(f"Alternative response type: {type(response)}")
        print(f"Has candidates: {hasattr(response, 'candidates')}")
        
        # Check if we have image data in the response
        if hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, 'content') and candidate.content:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            return {
                                "success": True,
                                "image_data": base64.b64encode(part.inline_data.data).decode('utf-8'),
                                "mime_type": part.inline_data.mime_type
                            }, None
        
        # If still no success, try one more approach
        return generate_backup_image(notes_content)
        
    except Exception as e:
        print(f"Alternative approach failed: {str(e)}")
        return generate_backup_image(notes_content)

def generate_backup_image(notes_content):
    """Final backup approach using a different model structure"""
    try:
        # Use original model
        print(f"Attempting backup approach with gemini-1.5-flash...")
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""Please generate an educational diagram for the following concept:
        
        {notes_content}
        
        The diagram should be designed for educational purposes with clear labels and visual elements."""
        
        response = model.generate_content(prompt)
        
        # Add detailed logging
        print(f"Backup response type: {type(response)}")
        print(f"Has text attribute: {hasattr(response, 'text')}")
        print(f"Has candidates: {hasattr(response, 'candidates')}")
        
        # If we didn't get an image but got text, provide text content
        if hasattr(response, 'text') and response.text:
            print("Returning text content as fallback")
            return {
                "success": True,
                "is_text": True,
                "text_content": response.text,
                "summary": "Educational content generated as text (image generation not supported)"
            }, None
        
        if hasattr(response, 'image') and response.image:
            return {
                "success": True,
                "image_data": response.image,
                "mime_type": "image/png"
            }, None
        
        if hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.mime_type.startswith('image/'):
                            return {
                                "success": True,
                                "image_data": base64.b64encode(part.inline_data.data).decode('utf-8'),
                                "mime_type": part.inline_data.mime_type
                            }, None
                        elif hasattr(part, 'text') and part.text:
                            return {
                                "success": True,
                                "is_text": True,
                                "text_content": part.text,
                                "summary": "Educational content generated as text (image generation not supported)"
                            }, None
        
        return None, "Unable to generate image with any available method"
        
    except Exception as e:
        print(f"All image generation attempts failed: {str(e)}")
        return None, f"All image generation attempts failed: {str(e)}"

if __name__ == "__main__":
    notes_content = "linked list is a data structure that is used to store a collection of elements in a linear manner. It is a collection of nodes where each node contains a data element and a pointer to the next node in the list."
    image_data, error = generate_image_from_notes(notes_content)
    if image_data:
        print("Image generated successfully")
        # Save the image for testing
        try:
            image_bytes = base64.b64decode(image_data["image_data"])
            with open("test_image.png", "wb") as f:
                f.write(image_bytes)
            print("Test image saved as test_image.png")
        except Exception as e:
            print(f"Error saving test image: {e}")
    else:
        print(f"Error: {error}")
