import google.generativeai as genai
from app.config import settings
import json
import asyncio

def configure_gemini(api_key: str | None = None):
    key = (api_key or settings.GEMINI_API_KEY or "").strip()
    if key and key != "your-gemini-api-key-here":
        genai.configure(api_key=key)

# Call on import with environment key if available
configure_gemini()

async def analyze_transcript(transcript: str, prompt: str = None, api_key: str | None = None) -> dict:
    """Analyze a transcript using Gemini and return structured JSON."""
    effective_key = (api_key or settings.GEMINI_API_KEY or "").strip()
    if not effective_key or effective_key == "your-gemini-api-key-here":
        raise Exception("Gemini API key is not configured. Please set it in Settings.")
    configure_gemini(effective_key)

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

async def generate_title_description(transcript: str, video_metadata: dict = None, api_key: str | None = None) -> dict:
    """Generate SEO-optimized title and description for a video."""
    effective_key = (api_key or settings.GEMINI_API_KEY or "").strip()
    if not effective_key or effective_key == "your-gemini-api-key-here":
         raise Exception("Gemini API key is not configured. Please set it in Settings.")
    configure_gemini(effective_key)

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


async def chat_with_ai(message: str, video_context: dict = None, api_key: str | None = None, history: list = None) -> dict:
    """Chat with AI for video editing commands. Returns a reply and optional actions."""
    effective_key = (api_key or settings.GEMINI_API_KEY or "").strip()
    if not effective_key or effective_key == "your-gemini-api-key-here":
        raise Exception("Gemini API key is not configured. Please add your Gemini API key in the Settings page.")
    configure_gemini(effective_key)

    video_info = ""
    if video_context:
        video_info = f"""
Currently loaded video info:
- Filename: {video_context.get('filename', 'Unknown')}
- Duration: {video_context.get('duration', 'Unknown')} seconds
- Resolution: {video_context.get('width', '?')}x{video_context.get('height', '?')}
- Has transcript: {video_context.get('has_transcript', False)}
"""

    system_instruction = f"""You are NovaCut AI, an intelligent video editing assistant. You help users edit their videos through natural language commands.

{video_info}

When the user asks you to perform an editing action, you MUST respond with valid JSON containing:
1. "reply": A friendly, natural language response explaining what you'll do.
2. "actions": A list of editing actions to perform. Each action has a "type" and relevant parameters.

Supported action types:
- "trim": Trim video. Params: "start_time" (seconds), "end_time" (seconds)
- "add_captions": Generate and add captions/subtitles. Params: none
- "remove_silence": Detect and remove silent parts. Params: "threshold_db" (optional, default -30)
- "analyze": Run AI analysis on the video. Params: none
- "generate_title": Generate an AI title and description. Params: none

If the user is just chatting or asking a question (not requesting an edit), respond with an empty actions list.

IMPORTANT: Always respond with valid JSON. No markdown, no backticks.

Example response for "trim from 5 to 15 seconds":
{{
    "reply": "I'll trim your video to keep only the segment from 0:05 to 0:15. Click the action button below to apply this edit.",
    "actions": [{{"type": "trim", "start_time": 5.0, "end_time": 15.0, "label": "✂️ Trim 0:05 → 0:15"}}]
}}

Example response for "add subtitles":
{{
    "reply": "I'll generate AI-powered captions for your video. This will analyze the audio and create subtitles automatically.",
    "actions": [{{"type": "add_captions", "label": "📝 Generate Captions"}}]
}}

Example response for "hello":
{{
    "reply": "Hello! I'm NovaCut AI, your video editing assistant. I can help you trim videos, add captions, remove silence, and more. Just tell me what you'd like to do!",
    "actions": []
}}
"""

    try:
        def _call_gemini():
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=system_instruction,
                generation_config={"response_mime_type": "application/json"}
            )
            if history and len(history) > 0:
                chat = model.start_chat(history=history)
                response = chat.send_message(message)
            else:
                response = model.generate_content(message)
            return response.text
            
        result_text = await asyncio.to_thread(_call_gemini)
        parsed = json.loads(result_text)
        return {
            "reply": parsed.get("reply", "I processed your request."),
            "actions": parsed.get("actions", [])
        }
    except json.JSONDecodeError:
        return {
            "reply": result_text if result_text else "Sorry, I had trouble understanding. Could you rephrase?",
            "actions": []
        }
    except Exception as e:
        raise Exception(f"AI Chat failed: {str(e)}")


async def analyze_image_with_gemini(image_path: str, api_key: str | None = None) -> dict:
    """Analyze an image using Gemini Vision to generate a title and description."""
    effective_key = (api_key or settings.GEMINI_API_KEY or "").strip()
    if not effective_key or effective_key == "your-gemini-api-key-here":
        raise Exception("Gemini API key is not configured. Please add your Gemini API key in the Settings page.")
    configure_gemini(effective_key)
    
    prompt = """
    Analyze this image. Generate an engaging, SEO-optimized title and description for it.
    
    Respond in strict JSON format like this:
    {
        "title": "An engaging title under 60 characters",
        "description": "A compelling description containing key visual details and engaging hooks."
    }
    """
    
    try:
        def _call_gemini():
            # Upload the file to Gemini
            uploaded_file = genai.upload_file(path=image_path)
            
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content([uploaded_file, prompt])
            
            # Clean up the uploaded file from Google's servers
            try:
                genai.delete_file(uploaded_file.name)
            except:
                pass
                
            return response.text
            
        result_text = await asyncio.to_thread(_call_gemini)
        return json.loads(result_text)
    except Exception as e:
        raise Exception(f"Gemini image analysis failed: {str(e)}")


class GeminiClient:
    def __init__(self):
        self.model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

def get_gemini_client():
    configure_gemini()
    return GeminiClient()
