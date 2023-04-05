from django.contrib import admin

# Register your models here.

from .models import Email

class EmailAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "subject", "timestamp", "read", "archived")
    list_display_links = ("id", "sender", "subject")
    list_filter = ("read", "archived")
    search_fields = ("sender", "subject", "body")
    list_per_page = 25
    

admin.site.register(Email, EmailAdmin)