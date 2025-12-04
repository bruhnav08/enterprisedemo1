from rest_framework.exceptions import ValidationError
import re

def validate_attributes(type_def, attributes):
    """
    Enforces R15, R18, R32: Validates incoming attributes against the Type Definition.
    Handles 'Sparse Matrix' by allowing non-mandatory fields to be missing.
    """
    if not isinstance(attributes, dict):
        raise ValidationError({"attributes": "Must be a valid JSON object."})

    schema = type_def.schema_definition
    fields_rules = schema.get('fields', [])
    
    clean_attributes = {}

    for rule in fields_rules:
        key = rule.get('name')
        is_mandatory = rule.get('mandatory', False)
        data_type = rule.get('type', 'string')
        value = attributes.get(key)

        # 1. Handle Empty/Missing Values
        if value is None or value == "":
            if is_mandatory:
                raise ValidationError({key: f"Attribute '{key}' is mandatory."})
            else:
                # R47: Omit empty optional values (Clean Sparse Data)
                continue

        # 2. Type Enforcement (Basic)
        if data_type == 'integer':
            try:
                value = int(value)
            except (ValueError, TypeError):
                raise ValidationError({key: "Must be an integer."})
        
        # 3. Future Rich Validation (Regex, etc.) can go here
        
        clean_attributes[key] = value

    # Preserve extra fields (adhoc attributes) that are not yet in schema 
    for k, v in attributes.items():
        if k not in clean_attributes and v not in [None, ""]:
             clean_attributes[k] = v
             
    return clean_attributes

def evolve_schema_automatically(type_def, attributes):
    """
    Implements R16, R30, R40, R41: Dynamic Schema Evolution.
    If the user saves a record with a NEW attribute, we update the TypeDefinition.
    """
    current_schema = type_def.schema_definition
    existing_field_names = {f['name'] for f in current_schema.get('fields', [])}
    
    schema_updated = False
    
    for key, value in attributes.items():
        # R40: Detect unknown keys
        if key not in existing_field_names:
            # Inference Logic
            inferred_type = 'integer' if isinstance(value, int) else 'string'
            
            # R29: Add new attribute definition
            new_rule = {
                "name": key,
                "type": inferred_type,
                "mandatory": False, 
                "validators": {}
            }
            
            # R41: Atomically update schema registry
            current_schema.setdefault('fields', []).append(new_rule)
            existing_field_names.add(key)
            schema_updated = True
            
    if schema_updated:
        type_def.schema_definition = current_schema
        type_def.save()

    return type_def