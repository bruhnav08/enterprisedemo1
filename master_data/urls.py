from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TypeDefinitionViewSet, MasterRecordViewSet

router = DefaultRouter()
router.register(r'types', TypeDefinitionViewSet)
router.register(r'records', MasterRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]