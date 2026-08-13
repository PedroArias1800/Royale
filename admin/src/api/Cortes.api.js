import axios from './axios.js';

export const getCortesConfigRequest = () =>
    axios.get('/api/cortes/config');

export const putCortesConfigRequest = (data) =>
    axios.put('/api/cortes/config', data);

export const getCortesPreviewRequest = (start, end) =>
    axios.get(`/api/cortes/preview?start=${start}&end=${end}`);

export const getCortesRequest = () =>
    axios.get('/api/cortes');

export const postCorteRequest = (data) =>
    axios.post('/api/cortes', data);

export const deleteCorteRequest = (id) =>
    axios.delete(`/api/cortes/${id}`);

export const markPaidRequest = (corteId, sellerId) =>
    axios.put(`/api/cortes/${corteId}/paid/${sellerId}`);

export const markUnpaidRequest = (corteId, sellerId) =>
    axios.put(`/api/cortes/${corteId}/unpaid/${sellerId}`);

export const getSellerSummaryRequest = () =>
    axios.get('/api/cortes/seller/summary');

export const getOpCostTypesRequest = () =>
    axios.get('/api/cortes/op-cost-types');

export const putOpCostTypesRequest = (data) =>
    axios.put('/api/cortes/op-cost-types', data);

export const getDeliveryConfigRequest = () =>
    axios.get('/api/cortes/delivery-config');

export const putDeliveryConfigRequest = (data) =>
    axios.put('/api/cortes/delivery-config', data);

export const getDeliveryPreviewRequest = (start, end) =>
    axios.get(`/api/cortes/delivery-preview?start=${start}&end=${end}`);
