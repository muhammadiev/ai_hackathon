from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    School,
    AcademicYear,
    Subject,
    ClassGroup,
    ClassSubject,
    ClassEnrollment,
    TeacherAssignment,
)


@admin.register(School)
class SchoolAdmin(ModelAdmin):
    list_display = ("name", "code", "timezone", "is_active", "created_at")
    search_fields = ("name", "code")
    list_filter = ("is_active",)
    prepopulated_fields = {"code": ("name",)}


@admin.register(AcademicYear)
class AcademicYearAdmin(ModelAdmin):
    list_display = ("school", "label", "starts_on", "ends_on", "is_current")
    list_filter = ("school", "is_current")
    search_fields = ("label", "school__name")


@admin.register(Subject)
class SubjectAdmin(ModelAdmin):
    list_display = ("name", "code", "school", "is_active")
    list_filter = ("school", "is_active")
    search_fields = ("name", "code")


class ClassSubjectInline(admin.TabularInline):
    model = ClassSubject
    extra = 0
    autocomplete_fields = ("subject",)


@admin.register(ClassGroup)
class ClassGroupAdmin(ModelAdmin):
    list_display = ("name", "grade", "school", "academic_year", "is_active")
    list_filter = ("school", "grade", "is_active")
    search_fields = ("name",)
    inlines = [ClassSubjectInline]


@admin.register(ClassEnrollment)
class ClassEnrollmentAdmin(ModelAdmin):
    list_display = ("student", "class_group", "pupil_code", "is_active", "enrolled_at")
    list_filter = ("class_group", "is_active")
    search_fields = ("student__username", "pupil_code", "student__profile__full_name")
    autocomplete_fields = ("student", "class_group", "academic_year")


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(ModelAdmin):
    list_display = ("teacher", "class_group", "subject", "academic_year", "is_active")
    list_filter = ("is_active", "subject")
    search_fields = ("teacher__username", "class_group__name")
    autocomplete_fields = ("teacher", "class_group", "subject", "academic_year")


@admin.register(ClassSubject)
class ClassSubjectAdmin(ModelAdmin):
    list_display = ("class_group", "subject", "is_active")
