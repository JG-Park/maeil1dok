from django.contrib import admin
from .models import BibleContentCache


@admin.register(BibleContentCache)
class BibleContentCacheAdmin(admin.ModelAdmin):
    list_display = [
        'cache_key',
        'version',
        'book',
        'chapter',
        'content_type',
        'fetch_success',
        'updated_at'
    ]
    list_filter = ['version', 'content_type', 'fetch_success']
    search_fields = ['cache_key', 'book']
    readonly_fields = ['cache_key', 'created_at', 'updated_at']
    ordering = ['version', 'book', 'chapter']

    fieldsets = (
        ('기본 정보', {
            'fields': ('cache_key', 'version', 'book', 'chapter')
        }),
        ('콘텐츠', {
            'fields': ('content', 'content_type', 'source_url'),
            'classes': ('collapse',)
        }),
        ('상태', {
            'fields': ('fetch_success', 'created_at', 'updated_at')
        }),
    )
