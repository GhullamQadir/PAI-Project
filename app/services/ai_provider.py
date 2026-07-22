import json
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.services.gemini_service import analyze_transcript as gemini_analyze, generate_title_description as gemini_generate_title_description, chat_with_ai as gemini_chat, analyze_image_with_gemini
from app.services.groq_service import analyze_transcript as groq_analyze, chat_with_ai as groq_chat
from app.services.runtime_config import get_api_keys, save_cooldown, is_in_cooldown, get_cooldown_status, increment_usage, get_usage_status

COOLDOWN_HOURS = 12

PROVIDER_GEMINI = 'gemini'
PROVIDER_GROQ = 'groq'


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _next_cooldown() -> str:
    return (_now() + timedelta(hours=COOLDOWN_HOURS)).isoformat()


def _is_limit_error(exception: Exception) -> bool:
    message = str(exception).lower()
    return any(
        term in message for term in [
            'rate limit',
            'quota',
            'limit exceeded',
            'too many requests',
            '429',
            'daily limit',
            'insufficient quota',
            'quota exceeded',
            'rate-limited'
        ]
    )


def _fallback_message() -> str:
    return (
        'AI service is temporarily limited. Gemini and Groq are both paused due to usage limits. '
        'Please wait 12 hours before trying again.'
    )


async def analyze_transcript(transcript: str, prompt: str = None) -> dict:
    keys = get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    groq_key = keys.get('groq_api_key')

    if gemini_key and not is_in_cooldown(PROVIDER_GEMINI):
        try:
            res = await gemini_analyze(transcript, prompt, api_key=gemini_key)
            increment_usage(PROVIDER_GEMINI)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GEMINI, _next_cooldown())
            else:
                raise

    if groq_key and not is_in_cooldown(PROVIDER_GROQ):
        try:
            res = await groq_analyze(transcript, prompt, model_name=settings.GROQ_MODEL, api_key=groq_key)
            increment_usage(PROVIDER_GROQ)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GROQ, _next_cooldown())
                raise Exception(_fallback_message())
            raise

    cooldowns = get_cooldown_status()
    if cooldowns[PROVIDER_GEMINI]['is_in_cooldown'] or cooldowns[PROVIDER_GROQ]['is_in_cooldown']:
        raise Exception(_fallback_message())

    raise Exception('No AI provider is configured. Please add Gemini and Groq API keys in Settings.')


async def generate_image_description(image_path: str) -> dict:
    keys = get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    
    # We only have image analysis via Gemini for now (Groq doesn't support images in our setup)
    if gemini_key and not is_in_cooldown(PROVIDER_GEMINI):
        try:
            res = await analyze_image_with_gemini(image_path, api_key=gemini_key)
            increment_usage(PROVIDER_GEMINI)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GEMINI, _next_cooldown())
            else:
                raise
                
    # Return placeholder if no Gemini key
    return {
        "title": "Image Media",
        "description": "An image uploaded to the media library. Provide a Gemini API Key to enable AI image analysis."
    }


async def generate_title_description(transcript: str, video_metadata: dict = None) -> dict:
    keys = get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    groq_key = keys.get('groq_api_key')

    if gemini_key and not is_in_cooldown(PROVIDER_GEMINI):
        try:
            res = await gemini_generate_title_description(transcript, video_metadata, api_key=gemini_key)
            increment_usage(PROVIDER_GEMINI)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GEMINI, _next_cooldown())
            else:
                raise

    # Fallback to Groq for title generation
    if groq_key and not is_in_cooldown(PROVIDER_GROQ):
        try:
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
            res = await groq_analyze(transcript, prompt, model_name=settings.GROQ_MODEL, api_key=groq_key)
            increment_usage(PROVIDER_GROQ)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GROQ, _next_cooldown())
                raise Exception(_fallback_message())
            raise

    cooldowns = get_cooldown_status()
    if cooldowns[PROVIDER_GEMINI]['is_in_cooldown'] or cooldowns[PROVIDER_GROQ]['is_in_cooldown']:
        raise Exception(_fallback_message())

    raise Exception('No AI provider is configured. Please add Gemini and Groq API keys in Settings.')


async def chat_with_ai(message: str, video_context: dict = None, history: list = None) -> dict:
    keys = get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    groq_key = keys.get('groq_api_key')

    if gemini_key and not is_in_cooldown(PROVIDER_GEMINI):
        try:
            res = await gemini_chat(message, video_context, api_key=gemini_key, history=history)
            increment_usage(PROVIDER_GEMINI)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GEMINI, _next_cooldown())
            else:
                raise

    if groq_key and not is_in_cooldown(PROVIDER_GROQ):
        try:
            res = await groq_chat(message, video_context, model_name=settings.GROQ_MODEL, api_key=groq_key, history=history)
            increment_usage(PROVIDER_GROQ)
            return res
        except Exception as exc:
            if _is_limit_error(exc):
                save_cooldown(PROVIDER_GROQ, _next_cooldown())
                raise Exception(_fallback_message())
            raise

    cooldowns = get_cooldown_status()
    if cooldowns[PROVIDER_GEMINI]['is_in_cooldown'] or cooldowns[PROVIDER_GROQ]['is_in_cooldown']:
        raise Exception(_fallback_message())

    raise Exception('No AI provider is configured. Please add Gemini and Groq API keys in Settings.')


def get_fallback_status() -> dict:
    status = get_cooldown_status()
    keys = get_api_keys()
    return {
        'gemini_key_set': bool(keys.get('gemini_api_key')),
        'groq_key_set': bool(keys.get('groq_api_key')),
        'cooldowns': status,
        'usage': get_usage_status()
    }
