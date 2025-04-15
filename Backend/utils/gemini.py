import re
import base64
import os
from typing import Optional, Dict, Any, Tuple
import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def validate_youtube_url(url: str) -> bool:
    youtube_regex = r'^(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})($|&|\?)'
    match = re.match(youtube_regex, url)
    return match is not None

def extract_video_id(url: str) -> Optional[str]:
    if not validate_youtube_url(url):
        return None
        
    pattern = r'(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def get_video_info(video_id: str) -> Dict[str, str]:
    """Get video title and description when transcript is not available"""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.find('meta', property='og:title')
        title = title['content'] if title else "Unknown Title"
        description = soup.find('meta', property='og:description')
        description = description['content'] if description else "No description available."
        
        return {
            "title": title,
            "description": description
        }
    except Exception as e:
        return {
            "title": "Video Information Unavailable",
            "description": f"Error retrieving video info: {str(e)}"
        }

def get_video_transcript(video_id: str) -> Tuple[str, bool]:
    """Get video transcript using YouTube Transcript API"""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join([item['text'] for item in transcript_list])
        return transcript_text, True
    except (TranscriptsDisabled, NoTranscriptFound):
        video_info = get_video_info(video_id)
        fallback_text = f"Title: {video_info['title']}\n\nDescription: {video_info['description']}"
        return fallback_text, False
    except Exception as e:
        return f"Error retrieving content: {str(e)}", False

def configure_gemini_api():
    """Configure the Gemini API with error handling"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return False, "API key not found. Make sure the GEMINI_API_KEY is set in the .env file."
        genai.configure(api_key=api_key)
        return True, None
    except Exception as e:
        return False, str(e)

def generate_educational_notes(youtube_url: str) -> str:
    """Generate educational notes from a YouTube video using its transcript"""
    video_id = extract_video_id(youtube_url)
    if not video_id:
        return "Invalid YouTube URL. Please provide a valid YouTube video link."
    success, error_message = configure_gemini_api()
    if not success:
        return f"API Configuration Error: {error_message}"
    content, transcript_available = get_video_transcript(video_id)
    
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

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')
        
        if transcript_available:
            prompt_source = "TRANSCRIPT"
        else:
            prompt_source = "VIDEO METADATA (NO TRANSCRIPT AVAILABLE)"
        
        prompt = f"""
        Create detailed educational notes from this YouTube video {prompt_source}:
        
        VIDEO ID: {video_id}
        URL: {youtube_url}
        
        CONTENT:
        {content}
        
        INSTRUCTIONS:
        1. Create comprehensive, well-structured educational notes in Markdown format
        2. Organize with clear headings, subheadings, bullet points, and concise paragraphs
        3. Include all key concepts, definitions, examples, and important points from the video content
        4. Ensure notes follow a logical progression matching the video's structure
        5. Use proper Markdown formatting (headers with #, lists with *, etc.)
        6. If content is limited to just title/description, explain that the full transcript was not available, but provide the best analysis possible based on available metadata
        7. Be factual and consistent - only include information that can be directly inferred from the provided content
        8. don't add any other text except the notes like "Okay here are the notes" or anything like that
        """

        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        if response.text:
            return response.text.strip()
        else:
            return "Failed to generate educational notes."

    except Exception as e:
        return f"Generation Error: {str(e)}"

def generate_context_image(context: str) -> Dict[str, Any]:
    """Generate an image that explains the given context.
    This function is only called when explicitly requested by the user."""
    success, error_message = configure_gemini_api()
    if not success:
        return {"error": f"API Configuration Error: {error_message}"}
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')
        prompt = f"""
        Create a visual explanation for the following educational content:
        {context}
        Generate an image that clearly illustrates the key concepts and relationships.
        Make the image informative, educational, and visually appealing.
        Use appropriate visual elements like diagrams, flowcharts, or illustrations to explain the concepts.
        """
        
        response = model.generate_content(prompt)

        text_response = ""
        image_data = None
        
        if hasattr(response, 'candidates') and response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text') and part.text:
                    text_response += part.text
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_data = part.inline_data.data
        
        image_base64 = None
        if image_data:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        return {
            "text": text_response,
            "image_base64": image_base64
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    test_url = "https://www.youtube.com/watch?v=CgkZ7MvWUAA"
    notes = generate_educational_notes(test_url)
    print(notes)

    test_context = "The concept of recursion in computer programming where a function calls itself."
    image_result = generate_context_image(test_context)
    if "error" not in image_result:
        print("Image generation successful")
    else:
        print("Image generation error:", image_result["error"])