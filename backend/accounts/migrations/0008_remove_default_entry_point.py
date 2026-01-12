# Generated migration to remove default_entry_point field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_update_userreadingsettings'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userreadingsettings',
            name='default_entry_point',
        ),
    ]
