# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_userprofile_follow_userachievement'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserReadingSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme', models.CharField(choices=[('light', '라이트'), ('dark', '다크'), ('system', '시스템')], default='light', help_text='화면 테마', max_length=10)),
                ('font_family', models.CharField(choices=[('ridi-batang', 'RIDI 바탕'), ('noto-serif', 'Noto Serif KR'), ('kopub-batang', 'KoPub 바탕'), ('pretendard', 'Pretendard'), ('noto-sans', 'Noto Sans KR'), ('system', '시스템 기본')], default='ridi-batang', help_text='글꼴', max_length=20)),
                ('font_size', models.IntegerField(default=16, help_text='글자 크기 (14-24)')),
                ('font_weight', models.CharField(choices=[('normal', '보통'), ('medium', '중간'), ('bold', '굵게')], default='normal', help_text='글자 두께', max_length=10)),
                ('line_height', models.CharField(choices=[('compact', '좁게'), ('normal', '보통'), ('wide', '넓게')], default='normal', help_text='줄 간격', max_length=10)),
                ('text_align', models.CharField(choices=[('left', '왼쪽'), ('justify', '양쪽 정렬')], default='left', help_text='텍스트 정렬', max_length=10)),
                ('verse_joining', models.BooleanField(default=False, help_text='절을 문단으로 연결하여 표시')),
                ('show_description', models.BooleanField(default=True, help_text='시편 머리말 표시 (새한글)')),
                ('show_cross_ref', models.BooleanField(default=True, help_text='교차 참조 표시 (새한글)')),
                ('highlight_names', models.BooleanField(default=True, help_text='인명/지명 강조 표시')),
                ('show_footnotes', models.BooleanField(default=False, help_text='각주 표시 (새한글)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='reading_settings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '읽기 설정',
                'verbose_name_plural': '읽기 설정',
            },
        ),
    ]
