from rest_framework import serializers
from django.db import transaction
from .models import TypeDefinition, MasterRecord
from .services import validate_attributes, evolve_schema_automatically

class TypeDefinitionSerializer(serializers.ModelSerializer):
    """
    Supports R7 (Create Type) and User Request (Master Configuration).
    Allows full read/write of schema_definition.
    """
    class Meta:
        model = TypeDefinition
        fields = '__all__'

    def validate_name(self, value):
        """
        R8: Type Name Constraints & Uniqueness.
        Prevent creating a duplicate type name, even if the existing one is inactive.
        """
        # Case-insensitive check
        # We exclude the current instance if we are doing an update (self.instance)
        queryset = TypeDefinition.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
            
        if queryset.exists():
            existing_type = queryset.first()
            if not existing_type.is_active:
                raise serializers.ValidationError(
                    f"The type '{value}' already exists but is currently INACTIVE. "
                    "Please go to Type Management and reactivate it instead of creating a duplicate."
                )
            else:
                raise serializers.ValidationError(f"The type '{value}' already exists.")
        
        return value

    def validate_schema_definition(self, value):
        """
        Enforces R11: Mandatory Initial Sub-Attribute.
        """
        if not isinstance(value, dict) or 'fields' not in value:
            return {"fields": []}
        
        fields = value.get('fields', [])
        
        # R11: User must define at least one attribute on creation if strict mode
        if self.instance is None and len(fields) == 0:
             raise serializers.ValidationError("R11: You must define at least one mandatory attribute when creating a new Type.")

        return value


class MasterRecordSerializer(serializers.ModelSerializer):
    formatted_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MasterRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'formatted_id']

    def get_formatted_id(self, obj):
        # R5: 5-Digit ID (00001)
        return str(obj.id).zfill(5)

    def validate(self, data):
        """
        R15 & R18: Enforce validation rules from the Registry.
        """
        record_type = data.get('record_type')
        if not record_type and self.instance:
            record_type = self.instance.record_type
            
        attributes = data.get('attributes', {})
        
        # Clean and Validate Data using Service Layer
        clean_attrs = validate_attributes(record_type, attributes)
        
        data['attributes'] = clean_attrs
        return data

    def create(self, validated_data):
        """
        Create Record + Evolve Schema (R30)
        """
        record_type = validated_data['record_type']
        attributes = validated_data['attributes']

        with transaction.atomic():
            evolve_schema_automatically(record_type, attributes)
            return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Update Record + Evolve Schema (R30, R13, R16)
        """
        record_type = instance.record_type
        attributes = validated_data.get('attributes', instance.attributes)

        with transaction.atomic():
            evolve_schema_automatically(record_type, attributes)
            return super().update(instance, validated_data)