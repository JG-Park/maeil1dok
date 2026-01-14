# Generated manually for token version tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_user_merge_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='token_version',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
