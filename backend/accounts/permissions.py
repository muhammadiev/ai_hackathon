from rest_framework.permissions import BasePermission


class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and u.global_role in ("teacher", "admin", "superadmin")
        )


class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and u.global_role in ("admin", "superadmin")
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.global_role == "superadmin")
