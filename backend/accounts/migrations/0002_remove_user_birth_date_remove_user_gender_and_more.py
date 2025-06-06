# Generated by Django 5.1.6 on 2025-02-24 06:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='birth_date',
        ),
        migrations.RemoveField(
            model_name='user',
            name='gender',
        ),
        migrations.AddField(
            model_name='user',
            name='nickname',
            field=models.CharField(default='', max_length=50, unique=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
