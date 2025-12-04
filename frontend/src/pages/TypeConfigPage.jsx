import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Box, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  Alert, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchTypeDetails, updateType } from '../services/api';

const TypeConfigPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [typeName, setTypeName] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [newAttr, setNewAttr] = useState({ name: '', type: 'string', mandatory: false });

  useEffect(() => {
    loadTypeDefinition();
  }, [id]);

  const loadTypeDefinition = async () => {
    try {
      const res = await fetchTypeDetails(id);
      setTypeName(res.data.name);
      // Load existing fields or empty array
      setAttributes(res.data.schema_definition?.fields || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load Type Definition.");
      setLoading(false);
    }
  };

  const handleAddAttribute = () => {
    if (!newAttr.name) return alert("Attribute Name is required");
    
    // Check for duplicates
    if (attributes.find(a => a.name === newAttr.name)) {
        return alert("Attribute name must be unique.");
    }

    const updatedList = [...attributes, { ...newAttr }];
    setAttributes(updatedList);
    setOpenModal(false);
    setNewAttr({ name: '', type: 'string', mandatory: false }); // Reset
  };

  const handleDeleteAttribute = (name) => {
    if (window.confirm(`Are you sure you want to delete '${name}'? Future records will not show this field.`)) {
        setAttributes(attributes.filter(a => a.name !== name));
    }
  };

  const handleSaveConfiguration = async () => {
    try {
        const payload = {
            name: typeName,
            schema_definition: {
                fields: attributes
            }
        };
        await updateType(id, payload);
        alert("Master Configuration Updated Successfully!");
        navigate('/'); // Go back to dashboard
    } catch (err) {
        alert("Failed to save configuration: " + JSON.stringify(err.response?.data));
    }
  };

  if (loading) return <Typography>Loading Configuration...</Typography>;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: '900px', mx: 'auto', mt: 4, borderRadius: 2 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
        </IconButton>
        <Box>
            <Typography variant="h5" fontWeight="bold">Master Configuration</Typography>
            <Typography variant="subtitle1" color="textSecondary">
                Editing Schema for Type: <Chip label={typeName} color="primary" sx={{ fontWeight: 'bold' }} />
            </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>User Independence:</strong> Define the structure here. These rules will be enforced for all future records.
      </Alert>

      {/* Attributes Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Attribute Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mandatory?</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {attributes.map((attr, index) => (
                    <TableRow key={index}>
                        <TableCell>{attr.name}</TableCell>
                        <TableCell>
                            <Chip label={attr.type} size="small" 
                                color={attr.type === 'integer' ? 'secondary' : 'default'} />
                        </TableCell>
                        <TableCell>
                            {attr.mandatory ? <Chip label="Required" color="error" size="small" /> : "Optional"}
                        </TableCell>
                        <TableCell>
                            <IconButton color="error" onClick={() => handleDeleteAttribute(attr.name)}>
                                <DeleteIcon />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
                {attributes.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} align="center">No attributes defined. Add one below.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </TableContainer>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="contained" color="secondary" onClick={() => setOpenModal(true)}>
            + Add Attribute
        </Button>
        <Button variant="contained" color="primary" size="large" onClick={handleSaveConfiguration}>
            Save Configuration
        </Button>
      </Box>

      {/* Add Attribute Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Attribute</DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField 
                    label="Attribute Name (e.g. 'expiration_date')" 
                    fullWidth 
                    value={newAttr.name} 
                    onChange={e => setNewAttr({...newAttr, name: e.target.value.replace(/\s/g, '_')})} 
                    helperText="Spaces will be replaced with underscores."
                />
                
                <FormControl fullWidth>
                    <InputLabel>Data Type</InputLabel>
                    <Select 
                        value={newAttr.type} 
                        label="Data Type"
                        onChange={e => setNewAttr({...newAttr, type: e.target.value})}
                    >
                        <MenuItem value="string">Text (String)</MenuItem>
                        <MenuItem value="integer">Number (Integer)</MenuItem>
                        <MenuItem value="boolean">Yes/No (Boolean)</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={
                        <Checkbox 
                            checked={newAttr.mandatory} 
                            onChange={e => setNewAttr({...newAttr, mandatory: e.target.checked})} 
                        />
                    }
                    label="Make this field Mandatory"
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddAttribute}>Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TypeConfigPage;