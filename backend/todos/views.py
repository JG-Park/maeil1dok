from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import pandas as pd
from datetime import datetime
from .models import DailyBibleSchedule
from .serializers import DailyBibleScheduleSerializer

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_schedule(request):
    if 'file' not in request.FILES:
        return Response({'error': '파일이 없습니다.'}, status=400)
    
    file = request.FILES['file']
    
    try:
        # 엑셀 파일 읽기
        df = pd.read_excel(file)
        
        # 필요한 컬럼 확인
        required_columns = ['날짜', '성경', '시작장', '끝장', '오디오']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                'error': f'필요한 컬럼이 없습니다: {", ".join(missing_columns)}'
            }, status=400)
        
        # 데이터 유효성 검사
        for index, row in df.iterrows():
            try:
                # 날짜 형식 검사
                if pd.isna(row['날짜']):
                    return Response({
                        'error': f'{index+1}번째 행의 날짜가 비어있습니다.'
                    }, status=400)
                
                # 필수 필드 검사
                if pd.isna(row['성경']) or pd.isna(row['시작장']) or pd.isna(row['끝장']):
                    return Response({
                        'error': f'{index+1}번째 행의 필수 데이터가 비어있습니다.'
                    }, status=400)
                
                # 숫자 형식 검사
                if not (str(row['시작장']).isdigit() and str(row['끝장']).isdigit()):
                    return Response({
                        'error': f'{index+1}번째 행의 장 번호가 올바르지 않습니다.'
                    }, status=400)
                
                # 시작장이 끝장보다 큰 경우 검사
                if int(row['시작장']) > int(row['끝장']):
                    return Response({
                        'error': f'{index+1}번째 행의 시작장이 끝장보다 큽니다.'
                    }, status=400)
            except Exception as e:
                return Response({
                    'error': f'{index+1}번째 행 처리 중 오류 발생: {str(e)}'
                }, status=400)
        
        # 데이터 처리 및 저장
        schedules = []
        for _, row in df.iterrows():
            schedule = DailyBibleSchedule(
                date=row['날짜'].date() if hasattr(row['날짜'], 'date') else row['날짜'],
                book=row['성경'],
                start_chapter=int(row['시작장']),
                end_chapter=int(row['끝장']),
                audio_link=row['오디오'] if not pd.isna(row['오디오']) else None
            )
            schedules.append(schedule)
        
        # 기존 데이터 삭제 (선택사항)
        # DailyBibleSchedule.objects.all().delete()
        
        # 벌크 생성
        try:
            DailyBibleSchedule.objects.bulk_create(schedules)
        except Exception as e:
            return Response({
                'error': f'데이터 저장 중 오류 발생: {str(e)}'
            }, status=400)
        
        return Response({
            'message': f'{len(schedules)}개의 일정이 등록되었습니다.',
            'count': len(schedules)
        })
        
    except Exception as e:
        return Response({
            'error': f'파일 처리 중 오류 발생: {str(e)}'
        }, status=400)

@api_view(['GET', 'POST'])
def bible_schedule_list(request):
    if request.method == 'GET':
        schedules = DailyBibleSchedule.objects.all().order_by('date')
        serializer = DailyBibleScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = DailyBibleScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'DELETE'])
def bible_schedule_detail(request, pk):
    try:
        schedule = DailyBibleSchedule.objects.get(pk=pk)
    except DailyBibleSchedule.DoesNotExist:
        return Response({'error': '일정을 찾을 수 없습니다.'}, status=404)

    if request.method == 'GET':
        serializer = DailyBibleScheduleSerializer(schedule)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        schedule.delete()
        return Response({'message': '일정이 삭제되었습니다.'}, status=200) 