import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = 60 * 60 * 24  # 24 hours


def get_youtube_transcript(video_id: str, languages: list = None) -> str | None:
    if languages is None:
        languages = ['ko', 'en']
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import (
            TranscriptsDisabled,
            NoTranscriptFound,
            VideoUnavailable,
        )
        
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id, languages=languages)
        full_text = ' '.join([snippet.text for snippet in transcript])
        return full_text
        
    except TranscriptsDisabled:
        logger.warning(f"Transcripts disabled for video: {video_id}")
        return None
    except NoTranscriptFound:
        logger.warning(f"No transcript found for video: {video_id}")
        return None
    except VideoUnavailable:
        logger.warning(f"Video unavailable: {video_id}")
        return None
    except Exception as e:
        logger.error(f"Error fetching transcript for {video_id}: {str(e)}")
        return None


def summarize_with_gemini(transcript: str) -> dict | None:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY not configured")
        return None
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        prompt = f"""다음은 하세나하시조 영상의 자막입니다. 이 영상을 다음 구조로 요약해주세요:

## 요약 구조
1. **오늘의 본문**: 성경 본문 내용 요약 (2-3문장)
2. **교역자 해설**: 교역자가 전달하는 핵심 메시지 (3-4문장)
3. **하시조 (나눔 실천 챌린지)**: 오늘 실천할 수 있는 구체적인 행동 지침

## 주의사항
- 간결하고 명확하게 작성
- 핵심 메시지에 집중
- 실천 가능한 구체적인 행동으로 마무리

## 영상 자막
{transcript}
"""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
            )
        )
        
        return {
            'summary': response.text,
            'model': 'gemini-2.0-flash'
        }
        
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        return None


def get_hasena_summary(video_id: str) -> dict:
    cache_key = f"hasena_summary_{video_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    transcript = get_youtube_transcript(video_id)
    if not transcript:
        return {
            'success': False,
            'error': '영상 자막을 가져올 수 없습니다.',
            'video_id': video_id
        }
    
    summary_result = summarize_with_gemini(transcript)
    if not summary_result:
        return {
            'success': False,
            'error': 'AI 요약을 생성할 수 없습니다.',
            'video_id': video_id
        }
    
    result = {
        'success': True,
        'video_id': video_id,
        'summary': summary_result['summary'],
        'model': summary_result['model']
    }
    
    cache.set(cache_key, result, CACHE_TIMEOUT)
    
    return result
