from django.apps import AppConfig


class BibleCacheConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bible_cache'
    verbose_name = '성경 본문 캐시'
