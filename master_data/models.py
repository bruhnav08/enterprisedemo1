from django.db import models

class TypeDefinition(models.Model):
    """
    Registry for User Generated Types.
    """
    name = models.CharField(max_length=20, unique=True)
    schema_definition = models.JSONField(default=dict)
    
    # NEW: The Soft Delete Flag
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MasterRecord(models.Model):
    """
    The Single Master Table.
    """
    # Keep CASCADE so hard deletion still works if explicitly requested
    record_type = models.ForeignKey(TypeDefinition, on_delete=models.CASCADE)
    attributes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-id']