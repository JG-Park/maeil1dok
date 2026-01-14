# Generated manually for account merge feature

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_emailverificationtoken_passwordresettoken'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='scheduled_deletion_at',
            field=models.DateTimeField(
                blank=True,
                help_text='계정 삭제 예정 시간 (병합 후 30일)',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='merged_into',
            field=models.ForeignKey(
                blank=True,
                help_text='이 계정이 병합된 대상 계정',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='merged_accounts',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
