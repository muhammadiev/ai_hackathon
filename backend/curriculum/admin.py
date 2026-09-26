from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Course, Topic, Video, VideoEntitlement, Exam

@admin.register(Course)
class CourseAdmin(ModelAdmin):
    list_display = ("title", "subject", "school", "grade", "is_published")

@admin.register(Topic)
class TopicAdmin(ModelAdmin):
    list_display = ("title", "course", "order")

@admin.register(Video)
class VideoAdmin(ModelAdmin):
    list_display = ("title", "subject", "is_free", "price", "is_published")

@admin.register(VideoEntitlement)
class VideoEntitlementAdmin(ModelAdmin):
    list_display = ("video", "user", "source", "created_at")

@admin.register(Exam)
class ExamAdmin(ModelAdmin):
    list_display = ("title", "exam_type", "school", "is_published")
