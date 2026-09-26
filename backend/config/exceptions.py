"""Consistent API error envelope + domain exceptions."""
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflict."
    default_code = "conflict"


class ForbiddenScopeError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Ruxsat yo‘q."
    default_code = "forbidden_scope"


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
            message = detail["detail"]
        else:
            message = detail
        response.data = {
            "ok": False,
            "status": response.status_code,
            "error": message,
        }
    return response
