import { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Paper, Typography, Box, Chip, TextField, InputAdornment, Switch, FormControlLabel } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { fetchTypes, fetchRecords, deleteType, updateType } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TypeManagementPage = () => {
  const [types, setTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchTypes(), fetchRecords()])
      .then(([tRes, rRes]) => {
        setTypes(tRes.data);
        setRecords(rRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDeleteType = async (id, event) => {
    event.stopPropagation();
    // FIX: globalThis
    if (globalThis.confirm("WARNING: Deleting a Type will delete ALL records associated with it. Are you sure?")) {
        try {
            await deleteType(id);
            setTypes(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            alert("Failed to delete type. It may have dependency constraints.");
        }
    }
  };

  const handleToggleActive = async (id, currentStatus, event) => {
      event.stopPropagation();
      try {
          const updatedTypes = types.map(t => 
              t.id === id ? { ...t, is_active: !currentStatus } : t
          );
          setTypes(updatedTypes);
          const typeToUpdate = types.find(t => t.id === id);
          await updateType(id, { ...typeToUpdate, is_active: !currentStatus });
      } catch (error) {
          console.error(error); // FIX: Log error
          loadData();
      }
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Type Name', 
      flex: 1, 
      renderCell: (p) => <Typography fontWeight="bold">{p.value}</Typography>
    },
    {
        field: 'is_active',
        headerName: 'Status',
        width: 150,
        renderCell: (params) => (
            <FormControlLabel
                control={
                    <Switch 
                        checked={params.value} 
                        onChange={(e) => handleToggleActive(params.row.id, params.value, e)}
                        color="success"
                        size="small"
                    />
                }
                label={params.value ? "Active" : "Inactive"}
                onClick={e => e.stopPropagation()}
            />
        )
    },
    { 
      field: 'record_count', 
      headerName: 'Total Records', 
      width: 150,
      type: 'number',
      renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" />
    },
    { 
      field: 'created_at', 
      headerName: 'Created On', 
      width: 250,
      valueFormatter: (value) => {
          if (!value) return '';
          return new Date(value).toLocaleString();
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Manage',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<ArrowForwardIcon />}
          label="Enter"
          onClick={() => navigate(`/manage/${params.id}`)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon color="error" />}
          label="Delete"
          onClick={(e) => handleDeleteType(params.id, e)}
          showInMenu={false}
        />
      ]
    }
  ];

  const allRows = types.map(t => {
    const recordCount = records.filter(r => r.record_type === t.id).length;
    return {
      id: t.id,
      name: t.name,
      is_active: t.is_active, 
      record_count: recordCount,
      created_at: t.created_at 
    };
  });

  const filteredRows = allRows.filter(row => 
    row.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Paper sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                Type Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
                Toggle <strong>Status</strong> to hide types from new entries.
            </Typography>
        </Box>
        
        <TextField 
            size="small"
            placeholder="Search Types..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 300 }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <DataGrid rows={filteredRows} columns={columns} loading={loading} disableRowSelectionOnClick />
      </Box>
    </Paper>
  );
};

export default TypeManagementPage;