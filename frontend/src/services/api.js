import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

// --- TYPE APIs ---
export const fetchTypes = () => API.get('types/');
export const fetchTypeDetails = (id) => API.get(`types/${id}/`);
export const createType = (data) => API.post('types/', data);
export const updateType = (id, data) => API.put(`types/${id}/`, data); 
export const deleteType = (id) => API.delete(`types/${id}/`);

// --- RECORD APIs ---
export const fetchRecords = () => API.get('records/');
export const fetchRecord = (id) => API.get(`records/${id}/`);
export const createRecord = (data) => API.post('records/', data);
export const updateRecord = (id, data) => API.put(`records/${id}/`, data);
export const deleteRecord = (id) => API.delete(`records/${id}/`);

export default API;