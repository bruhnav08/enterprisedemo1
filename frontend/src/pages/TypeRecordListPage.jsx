import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Paper, Typography, Box, Button, Breadcrumbs, 
  Link as MuiLink, TextField, InputAdornment 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { fetchTypeDetails, fetchRecords, deleteRecord } from '../services/api';

const TypeRecordListPage = () => {
  const { typeId } = useParams();
  const navigate = useNavigate();
  
  const [typeDef, setTypeDef] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 1. Load Data
  useEffect(() => {
    loadData();
  }, [typeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        fetchTypeDetails(typeId),
        fetchRecords()
      ]);
      setTypeDef(tRes.data);
      // FIX: Use Number.parseInt (SonarQube)
      const filtered = rRes.data.filter(r => r.record_type === Number.parseInt(typeId));
      setRecords(filtered);
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Delete Handler
  const handleDelete = async (id, event) => {
    event.stopPropagation(); 
    // FIX: Use globalThis (SonarQube)
    if(globalThis.confirm(`Delete Record #${id}? This cannot be undone.`)) {
        try {
            await deleteRecord(id);
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (e) { 
            alert("Delete failed. Please check your connection."); 
        }
    }
  };

  // 3. Grid Configuration
  const { gridRows, gridColumns } = useMemo(() => {
    if (!typeDef) return { gridRows: [], gridColumns: [] };

    // A. Static Columns
    const baseCols = [
        { field: 'formatted_id', headerName: 'ID', width: 100 },
        { 
            field: 'created_at', 
            headerName: 'Created At', 
            width: 220,
            valueFormatter: (value) => {
                if (!value) return '';
                return new Date(value).toLocaleString();
            }
        },
    ];

    // B. Dynamic Columns (From Schema)
    const schemaFields = typeDef.schema_definition?.fields || [];
    const dynamicCols = schemaFields.map(field => ({
        field: field.name,
        // FIX: Use replaceAll (SonarQube)
        headerName: field.name.toUpperCase().replaceAll(/_/g, ' '),
        flex: 1,
        minWidth: 150
    }));

    // C. Actions Column
    const actionCol = {
        field: 'actions', type: 'actions', headerName: 'Actions', width: 100,
        getActions: (params) => [
            // FIX: Added 'key' props to array elements (SonarQube)
            <GridActionsCellItem 
                key="edit"
                icon={<EditIcon />} 
                label="Edit" 
                onClick={() => navigate(`/edit/${params.id}`)} 
                showInMenu={false}
            />,
            <GridActionsCellItem 
                key="delete"
                icon={<DeleteIcon color="error" />} 
                label="Delete" 
                onClick={(e) => handleDelete(params.id, e)} 
                showInMenu={false}
            />,
        ]
    };

    // D. Flatten Data for Grid
    const rows = records.map(r => ({
        id: r.id,
        formatted_id: r.formatted_id,
        created_at: r.created_at, 
        ...r.attributes 
    }));

    return { gridRows: rows, gridColumns: [...baseCols, ...dynamicCols, actionCol] };
  }, [typeDef, records, navigate]);

  // 4. Client-Side Search
  const filteredGridRows = gridRows.filter(row => {
      if (!searchText) return true;
      return Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchText.toLowerCase())
      );
  });

  return (
    <Paper sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <MuiLink 
                underline="hover" 
                color="inherit" 
                onClick={() => navigate('/manage')} 
                sx={{ cursor: 'pointer' }}
            >
                Type Management
            </MuiLink>
            <Typography color="text.primary">{typeDef ? typeDef.name : 'Loading...'}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography variant="h5" fontWeight="bold">
                    {typeDef ? `Managing: ${typeDef.name}` : 'Loading...'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {filteredGridRows.length} records found.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                    size="small"
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    }}
                    sx={{ width: 250 }}
                />
                
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/manage')} 
                    variant="outlined"
                >
                    Back
                </Button>
            </Box>
        </Box>
      </Box>

      {/* Data Grid Section */}
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <DataGrid 
            rows={filteredGridRows} 
            columns={gridColumns} 
            loading={loading} 
            disableRowSelectionOnClick
        />
      </Box>
    </Paper>
  );
};

export default TypeRecordListPage;