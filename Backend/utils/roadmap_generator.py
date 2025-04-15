import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from utils.gemini import configure_gemini_api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DynamicLearningRoadmapGenerator:
    def __init__(self):
        """
        Initialize the roadmap generator with Gemini API
        """
        success, error = configure_gemini_api()
        if not success:
            raise Exception(f"Failed to configure Gemini API: {error}")
            
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')
        
        # Dynamic resource fetching configuration
        self.resource_categories = [
            'online_courses', 
            'tutorials', 
            'books', 
            'youtube_channels', 
            'community_forums'
        ]

    def generate_comprehensive_roadmap(self, topic: str) -> Dict[str, Any]:
        """
        Generate a comprehensive, dynamically created learning roadmap
        """
        try:
            # Generate topic overview
            overview = self._generate_topic_overview(topic)
            
            # Generate learning stages
            learning_stages = self._generate_learning_stages(topic)
            
            # Generate recommended resources
            recommended_resources = self._fetch_learning_resources(topic)
            
            # Generate learning challenges and projects
            learning_projects = self._generate_learning_projects(topic)
            
            # Compile roadmap
            roadmap = {
                "topic": topic,
                "overview": overview,
                "learning_stages": learning_stages,
                "recommended_resources": recommended_resources,
                "learning_projects": learning_projects
            }
            
            return roadmap
        
        except Exception as e:
            return {
                "error": f"Failed to generate roadmap: {str(e)}",
                "topic": topic
            }

    def _generate_topic_overview(self, topic: str) -> str:
        """
        Generate a comprehensive overview of the topic
        """
        prompt = f"""
        Provide a detailed, professional overview of {topic} as an educational domain.
        Include:
        - Brief historical context
        - Current significance in the professional world
        - Key areas of specialization
        - Why someone should learn this topic
        - don't add any other text except the overview
        
        Format the response in Markdown with proper headings, paragraphs, and bullet points.
        Keep the overview concise but informative, around 3-4 paragraphs.
        """
        
        response = self.model.generate_content(prompt)
        return response.text

    def _generate_learning_stages(self, topic: str) -> List[Dict]:
        """
        Dynamically generate learning stages with Gemini
        """
        prompt = f"""
        Design a comprehensive learning roadmap for {topic} with the following structure:
        
        For each stage (Beginner, Intermediate, Advanced, Expert), include:
        - Stage Name
        - Estimated Learning Duration
        - Key Learning Objectives (as bullet points)
        - Essential Skills to Develop (as bullet points)
        - don't add any other text except the roadmap
        
        Format the response in Markdown with clear headings for each stage.
        Ensure the stages build progressively and provide a clear learning trajectory.
        """
        
        response = self.model.generate_content(prompt)
        
        # Return the raw text for frontend parsing
        return response.text

    def _fetch_learning_resources(self, topic: str) -> Dict[str, Any]:
        """
        Dynamically fetch learning resources across multiple categories
        """
        prompt = f"""
        Provide a comprehensive list of FREE learning resources for {topic}, organized by category.
        
        Include these categories:
        1. Online Courses
        2. Tutorials
        3. Books and Documentation
        4. YouTube Channels
        5. Community Forums
        
        For each resource, provide:
        - Name with URL if available
        - Brief description (1-2 sentences)
        - Difficulty level (Beginner, Intermediate, Advanced)
        
        Format the response in Markdown with clear headings for each category.
        Focus only on free, high-quality resources that are currently available.
        don't add any other text except the resources
        """
        
        response = self.model.generate_content(prompt)
        return response.text

    def _generate_learning_projects(self, topic: str) -> str:
        """
        Generate project ideas for practical learning
        """
        prompt = f"""
        Generate 5 practical project ideas for learning {topic}:
        
        For each project, include:
        - Project Name
        - Difficulty Level (Beginner, Intermediate, Advanced)
        - Skills Developed (as bullet points)
        - Brief Project Description (2-3 sentences)
        - Implementation Tips (1-2 practical suggestions)
        - don't add any other text except the projects
        
        Format the response in Markdown with clear headings for each project.
        Make sure the projects are practical, engaging, and progressively challenging.
        """
        
        response = self.model.generate_content(prompt)
        return response.text 