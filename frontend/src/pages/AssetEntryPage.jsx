import { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // FIX: Added PropTypes
import { 
  Paper, Typography, Box, TextField, Button, Autocomplete, 
  IconButton, Grid, Switch, FormControlLabel, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock'; 
import { fetchTypes, fetchTypeDetails, createRecord, createType } from '../services/api';

// --- HELPER COMPONENTS ---

const validateAttribute = (attr) => {
    if (!attr.name) return "All attributes must have a name.";
    
    if (attr.mandatory && attr.type !== 'boolean') {
        if (attr.value === '' || attr.value === null || attr.value === undefined) {
            return `Field '${attr.name}' is mandatory.`;
        }
    }
    
    if (attr.value === '' || attr.value === null || attr.value === undefined) return null;

    if ((attr.type === 'string' || attr.type === 'email')) {
        if (attr.min && attr.value.length < attr.min) return `${attr.name} too short.`;
        if (attr.max && attr.value.length > attr.max) return `${attr.name} too long.`;
    }
    if (attr.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(attr.value)) return `${attr.name} invalid email.`;
    }
    if (attr.type === 'integer') {
        const val = Number(attr.value);
        if (attr.min !== undefined && val < attr.min) return `${attr.name} too low.`;
        if (attr.max !== undefined && val > attr.max) return `${attr.name} too high.`;
    }
    if (attr.type === 'date') {
        if (attr.minDate && attr.value < attr.minDate) return `${attr.name} too early.`;
        if (attr.maxDate && attr.value > attr.maxDate) return `${attr.name} too late.`;
    }
    return null;
};

const parseConstraints = (settings) => {
    const newSettings = { ...settings };
    if (newSettings.type === 'integer') {
        if (newSettings.min) newSettings.min = Number.parseFloat(newSettings.min);
        if (newSettings.max) newSettings.max = Number.parseFloat(newSettings.max);
    } else if (newSettings.type === 'string' || newSettings.type === 'email') {
        if (newSettings.min) newSettings.min = Number.parseInt(newSettings.min);
        if (newSettings.max) newSettings.max = Number.parseInt(newSettings.max);
    }
    if (newSettings.type === 'boolean') {
        newSettings.value = false;
    } else if (newSettings.type !== 'boolean' && typeof newSettings.value === 'boolean') {
        newSettings.value = '';
    }
    return newSettings;
};

const AttributeRow = ({ attr, index, onValueChange, onOpenSettings, onRemove }) => {
    // FIX: Simplified ternary logic
    let rowBgColor = '#fff';
    let rowBorderColor = '#e0e0e0';

    if (attr.isPrimary) {
        rowBgColor = '#fff0f0';
        rowBorderColor = '#ffcdd2';
    } else if (attr.isNew) {
        rowBgColor = '#fffbf2';
    }

    return (
        <Grid item xs={12}>
            <Paper variant="outlined" sx={{ 
                    p: 2, display: 'flex', alignItems: 'center', gap: 2, 
                    bgcolor: rowBgColor,
                    border: `1px solid ${rowBorderColor}`
                }}>
                
                <IconButton 
                    onClick={() => onOpenSettings(index)} 
                    color={attr.mandatory ? "error" : "default"}
                    sx={{ border: '1px solid #ddd' }}
                >
                    {attr.isPrimary ? <LockIcon fontSize="small" /> : <SettingsIcon fontSize="small" />}
                </IconButton>

                <Box sx={{ minWidth: 150 }}>
                    <Typography fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                        {attr.name || <span style={{color:'red'}}>*Un-named*</span>}
                        {attr.mandatory && <span style={{color:'red'}}> *</span>}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {attr.type ? attr.type.toUpperCase() : ''}
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    {(attr.type === 'string' || attr.type === 'email') && (
                        <TextField 
                            fullWidth size="small" placeholder={attr.type === 'email' ? "email@example.com" : "Enter text..."} 
                            value={attr.value || ''} onChange={e => onValueChange(index, e.target.value)}
                            error={attr.mandatory && !attr.value}
                        />
                    )}
                    {attr.type === 'integer' && (
                        <TextField 
                            fullWidth size="small" type="number" placeholder="0" 
                            value={attr.value || ''} onChange={e => onValueChange(index, e.target.value)}
                            error={attr.mandatory && !attr.value}
                        />
                    )}
                    {attr.type === 'date' && (
                        <TextField 
                            fullWidth size="small" type="date"
                            value={attr.value || ''} onChange={e => onValueChange(index, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            error={attr.mandatory && !attr.value}
                        />
                    )}
                    {attr.type === 'boolean' && (
                            <FormControlLabel
                            control={
                                <Switch 
                                    checked={attr.value === true}
                                    onChange={e => onValueChange(index, e.target.checked)}
                                />
                            }
                            label={attr.value ? "Yes" : "No"}
                            />
                    )}
                </Box>

                {!attr.isPrimary && attr.isNew && (
                    <IconButton color="error" onClick={() => onRemove(index)}>
                        <DeleteIcon />
                    </IconButton>
                )}
            </Paper>
        </Grid>
    );
};

// FIX: PropTypes Definition
AttributeRow.propTypes = {
    attr: PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
        mandatory: PropTypes.bool,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
        isPrimary: PropTypes.bool,
        isNew: PropTypes.bool,
        min: PropTypes.number,
        max: PropTypes.number,
        minDate: PropTypes.string,
        maxDate: PropTypes.string
    }).isRequired,
    index: PropTypes.number.isRequired,
    onValueChange: PropTypes.func.isRequired,
    onOpenSettings: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};

const AssetEntryPage = () => {
  const [existingTypes, setExistingTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null); 
  const [typeInputValue, setTypeInputValue] = useState(''); 

  const [attributes, setAttributes] = useState([]);
  const [settingsTargetIndex, setSettingsTargetIndex] = useState(null);
  const [tempSettings, setTempSettings] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => { loadTypes(); }, []);

  const loadTypes = async () => {
    try {
      const res = await fetchTypes();
      setExistingTypes(res.data);
    } catch (err) { console.error(err); }
  };

  const handleTypeChange = async (event, newValue) => {
    setStatus(null);
    if (newValue && typeof newValue === 'object') {
      setSelectedType(newValue);
      setTypeInputValue(newValue.name);
      loadSchemaForType(newValue.id);
    } 
    else if (typeof newValue === 'string') {
        const match = existingTypes.find(t => t.name.toLowerCase() === newValue.toLowerCase());
        
        if (match) {
            if (match.is_active === false) {
                alert(`The type '${match.name}' exists but is marked INACTIVE. Please reactivate it in Type Management.`);
                setSelectedType(null);
                setTypeInputValue('');
                setAttributes([]);
                return;
            }
            setSelectedType(match);
            setTypeInputValue(match.name);
            loadSchemaForType(match.id);
        } else {
            setSelectedType(null);
            setTypeInputValue(newValue);
            setAttributes([{ 
                name: 'Primary_ID', type: 'string', mandatory: true, value: '', isNew: true, isPrimary: true 
            }]);
        }
    } else {
        setSelectedType(null);
        setTypeInputValue('');
        setAttributes([]);
    }
  };

  const loadSchemaForType = async (typeId) => {
    try {
        const res = await fetchTypeDetails(typeId);
        const fields = res.data.schema_definition?.fields || [];
        
        const uiAttributes = fields.map((f, index) => ({
            name: f.name,
            type: f.type,
            mandatory: f.mandatory,
            value: f.type === 'boolean' ? false : '', 
            min: f.validators?.min,
            max: f.validators?.max,
            minDate: f.validators?.minDate,
            maxDate: f.validators?.maxDate,
            isNew: false, 
            isPrimary: index === 0 
        }));
        setAttributes(uiAttributes);
    } catch (err) { console.error(err); }
  };

  const handleValueChange = (index, val) => {
    const list = [...attributes];
    list[index].value = val;
    setAttributes(list);
  };

  const handleAddAttribute = () => {
    const isFirst = attributes.length === 0;
    setAttributes([...attributes, { 
        name: isFirst ? 'Primary_ID' : '', 
        type: 'string', 
        mandatory: isFirst, 
        value: '', 
        isNew: true,
        isPrimary: isFirst 
    }]);
  };

  const handleRemoveAttribute = (index) => {
    const list = [...attributes];
    if (list[index].isPrimary) return alert("Security Block: You cannot delete the Primary Identity field.");
    if (!list[index].isNew && selectedType) return alert("Cannot delete pre-existing schema fields from Entry view.");
    list.splice(index, 1);
    setAttributes(list);
  };

  const openSettings = (index) => {
    setSettingsTargetIndex(index);
    setTempSettings({ ...attributes[index] });
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    if(!tempSettings.name) return alert("Attribute Name is required");
    const safeName = tempSettings.name.replaceAll(/\s/g, '_'); // FIX: replaceAll

    if(attributes.some((a, i) => i !== settingsTargetIndex && a.name === safeName)) {
        return alert("Attribute name must be unique");
    }

    if (tempSettings.isPrimary) tempSettings.mandatory = true;

    const cleanedSettings = parseConstraints(tempSettings);

    const list = [...attributes];
    list[settingsTargetIndex] = { ...cleanedSettings, name: safeName };
    setAttributes(list);
    setSettingsOpen(false);
  };

  const handleSubmit = async () => {
    if (!typeInputValue) return alert("Please select or type a Record Type.");
    if (attributes.length === 0) return alert("At least one attribute is required.");
    
    for (const attr of attributes) {
        const error = validateAttribute(attr);
        if (error) return alert(error);
    }

    if (attributes[0] && (!attributes[0].mandatory || !attributes[0].isPrimary)) {
        const list = [...attributes];
        list[0].mandatory = true;
        list[0].isPrimary = true;
        setAttributes(list);
    }

    try {
        let typeId = selectedType?.id;
        if (!selectedType) {
            const schemaFields = attributes.map(a => ({
                name: a.name, type: a.type, mandatory: a.mandatory,
                validators: { 
                    min: a.min, max: a.max, 
                    minDate: a.minDate, maxDate: a.maxDate 
                }
            }));
            if (!schemaFields[0].mandatory) schemaFields[0].mandatory = true;
            const typeRes = await createType({ 
                name: typeInputValue, 
                schema_definition: { fields: schemaFields } 
            });
            typeId = typeRes.data.id;
        }

        const recordAttributes = {};
        attributes.forEach(a => {
            if (a.type === 'boolean') {
                recordAttributes[a.name] = a.value;
            } else if (a.value !== '' && a.value !== null && a.value !== undefined) {
                if (a.type === 'integer') recordAttributes[a.name] = parseInt(a.value);
                else recordAttributes[a.name] = a.value;
            }
        });

        await createRecord({ record_type: typeId, attributes: recordAttributes });
        setStatus({ type: 'success', msg: `Record saved successfully!` });
        
        if (!selectedType) {
             await loadTypes();
             const newTypeObj = (await fetchTypes()).data.find(t => t.name === typeInputValue);
             if(newTypeObj) handleTypeChange(null, newTypeObj);
        } else {
            const clearedAttrs = attributes.map(a => ({ 
                ...a, 
                value: a.type === 'boolean' ? false : '' 
            }));
            setAttributes(clearedAttrs);
        }

    } catch (err) {
        setStatus({ type: 'error', msg: "Save Failed: " + JSON.stringify(err.response?.data) });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: '900px', mx: 'auto', borderRadius: 2 }}>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Asset Record Entry</Typography>
        <Typography variant="body2" color="text.secondary">
            Select an existing type OR type a new name to create a new category on the fly.
        </Typography>
      </Box>

      <Box sx={{ mb: 4, bgcolor: '#f5f5f5', p: 3, borderRadius: 2 }}>
          <Autocomplete
            freeSolo
            options={existingTypes.filter(t => t.is_active !== false)}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            value={selectedType || typeInputValue}
            onChange={handleTypeChange}
            onInputChange={(event, newInputValue) => {
                if(!selectedType) setTypeInputValue(newInputValue);
            }}
            renderInput={(params) => (
                <TextField {...params} label="Record Type" variant="outlined" />
            )}
          />
      </Box>

      {status && <Alert severity={status.type} sx={{ mb: 3 }}>{status.msg}</Alert>}

      {(selectedType || typeInputValue) && (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Attributes & Data</Typography>
                <Chip label={selectedType ? "Existing Schema Mode" : "New Schema Definition Mode"} color={selectedType ? "success" : "warning"} variant="outlined" />
            </Box>

            <Grid container spacing={2}>
                {attributes.map((attr, index) => (
                    // FIX: Use attribute Name as Key if available, else index
                    <AttributeRow 
                        key={attr.name || index} 
                        attr={attr} 
                        index={index} 
                        onValueChange={handleValueChange}
                        onOpenSettings={openSettings}
                        onRemove={handleRemoveAttribute}
                    />
                ))}
            </Grid>

            <Button startIcon={<AddCircleOutlineIcon />} fullWidth sx={{ mt: 2 }} onClick={handleAddAttribute}>
                Add Another Field
            </Button>

            <Divider sx={{ my: 4 }} />

            <Button variant="contained" size="large" fullWidth startIcon={<SaveIcon />} onClick={handleSubmit} sx={{ py: 2 }}>
                SAVE RECORD
            </Button>
        </Box>
      )}

      {/* Dialog kept simplified for brevity */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Field Settings</DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField label="Field Name" fullWidth value={tempSettings.name} onChange={e => setTempSettings({...tempSettings, name: e.target.value})} disabled={!tempSettings.isNew} />
                <FormControl fullWidth>
                    <InputLabel>Data Type</InputLabel>
                    <Select value={tempSettings.type} label="Data Type" onChange={e => setTempSettings({...tempSettings, type: e.target.value})} disabled={!tempSettings.isNew}>
                        <MenuItem value="string">Text</MenuItem>
                        <MenuItem value="integer">Number</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                    </Select>
                </FormControl>
                <FormControlLabel control={<Switch checked={tempSettings.mandatory} onChange={e => setTempSettings({...tempSettings, mandatory: e.target.checked})} disabled={tempSettings.isPrimary} />} label="Is Mandatory?" />
                
                {(tempSettings.type === 'string' || tempSettings.type === 'email') && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Min" type="number" size="small" value={tempSettings.min || ''} onChange={e => setTempSettings({...tempSettings, min: e.target.value})} />
                        <TextField label="Max" type="number" size="small" value={tempSettings.max || ''} onChange={e => setTempSettings({...tempSettings, max: e.target.value})} />
                    </Box>
                )}
                {tempSettings.type === 'integer' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Min Value" type="number" size="small" value={tempSettings.min || ''} onChange={e => setTempSettings({...tempSettings, min: e.target.value})} />
                        <TextField label="Max Value" type="number" size="small" value={tempSettings.max || ''} onChange={e => setTempSettings({...tempSettings, max: e.target.value})} />
                    </Box>
                )}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveSettings}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AssetEntryPage;