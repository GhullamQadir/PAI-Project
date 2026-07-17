import google.generativeai as genai
from app.config import settings
import json
import asyncio

def configure_gemini():
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)

# Call on import
configure_gemini()

async def analyze_transcript(transcript: str, prompt: str = None) -> dict:
    """Analyze a transcript using Gemini and return structured JSON."""
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key is not configured")

    system_instruction = """
    You are an AI video editing assistant. Your task is to analyze the provided video transcript and extract useful information.
    Please respond ONLY with valid JSON matching the requested structure. Do not include markdown formatting or backticks around the JSON.
    """

    default_prompt = f"""
    Analyze the following video transcript.
    Provide a comprehensive analysis including:
    1. 'summary': A brief 2-3 sentence summary of the video.
    2. 'chapters': A list of logical chapters/sections (each with a 'title' and 'reasoning').
    3. 'keywords': A list of key topics discussed.
    
    Transcript:
    {transcript}
    
    Respond in strict JSON format like this:
    {{
        "summary": "...",
        "chapters": [{{"title": "...", "reasoning": "..."}}],
        "keywords": ["...", "..."]
    }}
    """
    
    final_prompt = prompt or default_prompt

    try:
        def _call_gemini():
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=system_instruction,
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(final_prompt)
            return response.text
            
        result_text = await asyncio.to_thread(_call_gemini)
        return json.loads(result_text)
    except Exception as e:
        raise Exception(f"Gemini analysis failed: {str(e)}")

async def generate_title_description(transcript: str, video_metadata: dict = None) -> dict:
    """Generate SEO-optimized title and description for a video."""
    if not settings.GEMINI_API_KEY:
         raise Exception("Gemini API key is not configured")

    prompt = f"""
    Generate an engaging, SEO-optimized title and description for a video based on its transcript.
    
    Transcript:
    {transcript}
    
    Metadata:
    {video_metadata or 'None provided'}
    
    Respond in strict JSON format like this:
    {{
        "title": "An engaging title under 60 characters",
        "description": "A compelling description containing key topics and engaging hooks."
    }}
    """

    try:
        def _call_gemini():
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(prompt)
            return response.text
            
        result_text = await asyncio.to_thread(_call_gemini)
        return json.loads(result_text)
    except Exception as e:
         raise Exception(f"Gemini title generation failed: {str(e)}")
