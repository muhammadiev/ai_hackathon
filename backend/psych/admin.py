from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Questionnaire, PsychResponse

@admin.register(Questionnaire)
class QuestionnaireAdmin(ModelAdmin):
    list_display = ("title", "version", "is_active", "school")

@admin.register(PsychResponse)
class PsychResponseAdmin(ModelAdmin):
    list_display = ("questionnaire", "student", "created_at")
