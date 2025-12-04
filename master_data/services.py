from rest_framework.exceptions import ValidationError

def _validate_single_value(key, value, rule):
    """
    Helper to validate a single attribute constraint.
    Reduces Cognitive Complexity.
    """
    is_mandatory = rule.get('mandatory', False)
    data_type = rule.get('type', 'string')

    # 1. Handle Empty/Missing Values
    if value is None or value == "":
        if is_mandatory:
            raise ValidationError({key: f"Attribute '{key}' is mandatory."})
        # If optional and empty, return None to signal it can be skipped
        return None 

    # 2. Type Enforcement
    if data_type == 'integer':
        try:
            return int(value)
        except (ValueError, TypeError):
            raise ValidationError({key: "Must be an integer."})
    
    return value

def validate_attributes(type_def, attributes):
    """
    Enforces validation rules from the Registry.
    """
    if not isinstance(attributes, dict):
        raise ValidationError({"attributes": "Must be a valid JSON object."})

    schema = type_def.schema_definition
    fields_rules = schema.get('fields', [])
    
    clean_attributes = {}

    for rule in fields_rules:
        key = rule.get('name')
        value = attributes.get(key)
        
        # Use helper function
        validated_value = _validate_single_value(key, value, rule)
        
        if validated_value is not None:
            clean_attributes[key] = validated_value

    # Preserve extra fields (adhoc attributes) that are not yet in schema 
    for k, v in attributes.items():
        if k not in clean_attributes and v not in [None, ""]:
             clean_attributes[k] = v
             
    return clean_attributes

def evolve_schema_automatically(type_def, attributes):
    """
    Implements Dynamic Schema Evolution.
    """
    current_schema = type_def.schema_definition
    existing_field_names = {f['name'] for f in current_schema.get('fields', [])}
    
    schema_updated = False
    
    for key, value in attributes.items():
        if key not in existing_field_names:
            inferred_type = 'integer' if isinstance(value, int) else 'string'
            new_rule = {
                "name": key,
                "type": inferred_type,
                "mandatory": False, 
                "validators": {}
            }
            current_schema.setdefault('fields', []).append(new_rule)
            existing_field_names.add(key)
            schema_updated = True
            
    if schema_updated:
        type_def.schema_definition = current_schema
        type_def.save()

    return type_def