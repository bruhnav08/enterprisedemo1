from rest_framework import viewsets
from .models import TypeDefinition, MasterRecord
from .serializers import TypeDefinitionSerializer, MasterRecordSerializer

class TypeDefinitionViewSet(viewsets.ModelViewSet):
    """
    API Endpoint for the 'Rulebooks' (Types).
    Supports GET, POST, PUT, DELETE.
    """
    queryset = TypeDefinition.objects.all()
    serializer_class = TypeDefinitionSerializer

class MasterRecordViewSet(viewsets.ModelViewSet):
    """
    API Endpoint for the 'Master Data' (Records).
    Supports GET, POST, PUT, DELETE.
    """
    queryset = MasterRecord.objects.all()
    serializer_class = MasterRecordSerializer