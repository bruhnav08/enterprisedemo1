import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { Paper, Typography, Box, CircularProgress, Alert, Button, Divider } from '@mui/material';
import axios from 'axios';

const EditRecordPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [recordType, setRecordType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchRecordData();
  }, [id]);

  const fetchRecordData = async () => {
    try {
      const recordRes = await axios.get(`http://127.0.0.1:8000/api/records/${id}/`);
      const record = recordRes.data;
      setFormData(record.attributes);
      
      const typeRes = await axios.get(`http://127.0.0.1:8000/api/types/${record.record_type}/`);
      setRecordType(typeRes.data);
      setSchema(convertRules(typeRes.data.schema_definition));
      
    } catch (err) {
      setStatus({ type: 'error', msg: "Failed to load record." });
    } finally {
      setLoading(false);
    }
  };

  const convertRules = (backendRules) => {
    if (!backendRules?.fields) return null;
    const properties = {};
    const required = [];
    
    backendRules.fields.forEach(f => {
      // FIX: Removed redundant default assignment 'string'
      let fieldType; 
      let fieldFormat;

      if (f.type === 'integer') {
          fieldType = 'integer';
      } else if (f.type === 'boolean') {
          fieldType = 'boolean';
      } else if (f.type === 'date') { 
          fieldType = 'string'; 
          fieldFormat = 'date'; 
      } else {
          fieldType = 'string';
      }

      properties[f.name] = { 
        type: fieldType, 
        format: fieldFormat,
        // FIX: replaceAll
        title: f.name.replaceAll(/_/g, ' ').toUpperCase() 
      };
      
      if (f.mandatory) required.push(f.name);
    });

    return { type: "object", properties, required, title: "" };
  };

  const handleUpdate = async ({ formData }) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/records/${id}/`, {
        record_type: recordType.id,
        attributes: formData
      });
      setStatus({ type: 'success', msg: "Record Updated Successfully!" });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setStatus({ type: 'error', msg: "Update Failed." });
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: '800px', mx: 'auto', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Edit Record #{String(id).padStart(5,'0')}</Typography>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {status && <Alert severity={status.type} sx={{ mb: 2 }}>{status.msg}</Alert>}

      {schema && (
          <Form 
            schema={schema} 
            validator={validator} 
            formData={formData} 
            onChange={e => setFormData(e.formData)}
            onSubmit={handleUpdate}
            additionalProperties={true} 
          />
      )}
    </Paper>
  );
};

export default EditRecordPage;