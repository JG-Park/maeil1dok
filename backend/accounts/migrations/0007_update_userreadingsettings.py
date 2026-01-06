# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_userreadingsettings'),
    ]

    operations = [
        # line_height 필드를 CharField에서 FloatField로 변경
        migrations.AlterField(
            model_name='userreadingsettings',
            name='line_height',
            field=models.FloatField(default=1.8, help_text='줄 간격 (1.4-2.4)'),
        ),
        # 누락된 필드 추가
        migrations.AddField(
            model_name='userreadingsettings',
            name='show_verse_numbers',
            field=models.BooleanField(default=True, help_text='절 번호 표시'),
        ),
        migrations.AddField(
            model_name='userreadingsettings',
            name='tongdok_auto_complete',
            field=models.BooleanField(default=False, help_text='통독모드 자동 완료'),
        ),
        migrations.AddField(
            model_name='userreadingsettings',
            name='default_entry_point',
            field=models.CharField(
                choices=[
                    ('last-position', '마지막 위치'),
                    ('home', '홈'),
                    ('toc', '목차'),
                ],
                default='last-position',
                help_text='기본 진입점',
                max_length=20
            ),
        ),
    ]
