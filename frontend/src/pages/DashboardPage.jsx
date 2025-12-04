import { useState, useEffect, useMemo } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { fetchTypes, fetchRecords } from '../services/api';

const DashboardPage = () => {
  const [records, setRecords] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTypes(), fetchRecords()])
      .then(([tRes, rRes]) => {
        setTypes(tRes.data);
        setRecords(rRes.data);
      })
      .catch(err => {
          console.error("Dashboard Load Error:", err);
          setRecords([]); 
          setTypes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const { gridRows, gridColumns } = useMemo(() => {
    const filteredRecords = selectedTypeId 
      ? records.filter(r => r.record_type === parseInt(selectedTypeId))
      : records;

    const baseCols = [
      { field: 'formatted_id', headerName: 'ID', width: 90 },
      { 
        field: 'type_name', headerName: 'TYPE', width: 150,
        renderCell: (params) => <Chip label={params.value} size="small" color="primary" variant="outlined"/>
      }
    ];

    let dynamicCols = [];
    if (selectedTypeId) {
        const allAttributeKeys = new Set();
        filteredRecords.forEach(r => {
          if (r.attributes) Object.keys(r.attributes).forEach(k => allAttributeKeys.add(k));
        });
        dynamicCols = Array.from(allAttributeKeys).map(key => ({
          field: key, headerName: key.toUpperCase(), flex: 1, minWidth: 150
        }));
    } else {
        dynamicCols = [{
            field: 'summary', headerName: 'ATTRIBUTES SUMMARY', flex: 2,
            // FIX: Updated signature for modern DataGrid to prevent crash
            valueGetter: (value, row) => {
               if (!row) return ""; 
               return Object.keys(row).filter(k => !['id','formatted_id','type_name','record_type'].includes(k)).join(", ")
            }
        }];
    }

    const rows = filteredRecords.map(r => {
        const typeObj = types.find(t => t.id === r.record_type);
        return {
            id: r.id, 
            formatted_id: r.formatted_id,
            type_name: typeObj ? typeObj.name : "Unknown",
            record_type: r.record_type,
            ...r.attributes 
        };
    });

    return { gridRows: rows, gridColumns: [...baseCols, ...dynamicCols] };
  }, [selectedTypeId, records, types]);

  return (
    <Paper elevation={0} sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight="bold">
            Master Data Registry
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select value={selectedTypeId} label="Filter by Type" onChange={(e) => setSelectedTypeId(e.target.value)}>
            <MenuItem value=""><em>View All</em></MenuItem>
            {types.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <DataGrid
        rows={gridRows}
        columns={gridColumns}
        slots={{ toolbar: GridToolbar }}
        loading={loading}
        disableRowSelectionOnClick
      />
    </Paper>
  );
};

export default DashboardPage;