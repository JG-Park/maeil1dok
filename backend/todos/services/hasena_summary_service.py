import logging
from datetime import date
from django.conf import settings

logger = logging.getLogger(__name__)


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
    api_key = getattr(settings, 'GEMINI_API_KEY', None)
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
        error_str = str(e)
        logger.error(f"Error calling Gemini API: {error_str}")
        
        # 할당량 초과 에러인 경우 특별 처리
        if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
            return {'error': 'quota_exceeded', 'message': 'API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.'}
        
        return None


def get_hasena_summary(video_id: str, video_date: date = None) -> dict:
    from ..models import HasenaSummary
    
    try:
        existing = HasenaSummary.objects.filter(video_id=video_id).first()
        if existing:
            return {
                'success': True,
                'video_id': video_id,
                'summary': existing.summary,
                'model': existing.model_used,
                'is_edited': existing.is_edited,
                'video_date': existing.video_date.isoformat() if existing.video_date else None,
                'title': existing.title,
            }
    except Exception as e:
        logger.error(f"Error checking existing summary: {str(e)}")
    
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
    
    # 할당량 초과 에러 처리
    if summary_result.get('error') == 'quota_exceeded':
        return {
            'success': False,
            'error': summary_result.get('message', 'API 할당량 초과'),
            'video_id': video_id,
            'retry_after': 60
        }
    
    try:
        summary_obj, created = HasenaSummary.objects.update_or_create(
            video_id=video_id,
            defaults={
                'summary': summary_result['summary'],
                'transcript': transcript,
                'model_used': summary_result['model'],
                'video_date': video_date,
                'is_edited': False,
            }
        )
        
        return {
            'success': True,
            'video_id': video_id,
            'summary': summary_obj.summary,
            'model': summary_obj.model_used,
            'is_edited': summary_obj.is_edited,
            'video_date': summary_obj.video_date.isoformat() if summary_obj.video_date else None,
            'title': summary_obj.title,
            'created': created,
        }
        
    except Exception as e:
        logger.error(f"Error saving summary: {str(e)}")
        return {
            'success': True,
            'video_id': video_id,
            'summary': summary_result['summary'],
            'model': summary_result['model'],
        }


def regenerate_summary_for_video(video_id: str) -> dict:
    from ..models import HasenaSummary
    
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
    
    try:
        existing = HasenaSummary.objects.filter(video_id=video_id).first()
        
        if existing:
            existing.summary = summary_result['summary']
            existing.transcript = transcript
            existing.model_used = summary_result['model']
            existing.is_edited = False
            existing.save()
            summary_obj = existing
        else:
            summary_obj = HasenaSummary.objects.create(
                video_id=video_id,
                summary=summary_result['summary'],
                transcript=transcript,
                model_used=summary_result['model'],
            )
        
        return {
            'success': True,
            'video_id': video_id,
            'summary': summary_obj.summary,
            'model': summary_obj.model_used,
        }
        
    except Exception as e:
        logger.error(f"Error regenerating summary: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'video_id': video_id
        }


def update_summary(video_id: str, summary: str, title: str = None) -> dict:
    from ..models import HasenaSummary
    
    try:
        existing = HasenaSummary.objects.filter(video_id=video_id).first()
        
        if not existing:
            return {
                'success': False,
                'error': '해당 영상의 요약을 찾을 수 없습니다.',
                'video_id': video_id
            }
        
        existing.summary = summary
        existing.is_edited = True
        if title:
            existing.title = title
        existing.save()
        
        return {
            'success': True,
            'video_id': video_id,
            'summary': existing.summary,
            'title': existing.title,
            'is_edited': True,
        }
        
    except Exception as e:
        logger.error(f"Error updating summary: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'video_id': video_id
        }


def list_summaries(page: int = 1, page_size: int = 20) -> dict:
    from ..models import HasenaSummary
    
    try:
        total = HasenaSummary.objects.count()
        offset = (page - 1) * page_size
        
        summaries = HasenaSummary.objects.all()[offset:offset + page_size]
        
        return {
            'success': True,
            'total': total,
            'page': page,
            'page_size': page_size,
            'summaries': [
                {
                    'id': s.id,
                    'video_id': s.video_id,
                    'video_date': s.video_date.isoformat() if s.video_date else None,
                    'title': s.title,
                    'summary_preview': s.summary[:200] + '...' if len(s.summary) > 200 else s.summary,
                    'is_edited': s.is_edited,
                    'model_used': s.model_used,
                    'updated_at': s.updated_at.isoformat(),
                }
                for s in summaries
            ]
        }
        
    except Exception as e:
        logger.error(f"Error listing summaries: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
