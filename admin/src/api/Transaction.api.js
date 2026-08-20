import axios from './axios.js'

export const getAllTransactionsRequest = async (page = 1) =>
    await axios.get(`/api/transaction/all?page=${page}`)

export const getPendingTransactionsRequest = async (page = 1) =>
    await axios.get(`/api/transactions/pending?page=${page}`)

export const getManualTransactionsRequest = async (start, end) =>
    await axios.get(`/api/transactions/manual?start=${start}T00:00:00&end=${end}T23:59:59`)

export const putTransactionRequest = async (id, data) =>
    await axios.put(`/api/transactions/${id}`, data)

export const postManualTransactionRequest = async (data) =>
    await axios.post('/api/transactions/manual', data)

export const deleteManualTransactionRequest = async (id) =>
    await axios.delete(`/api/transactions/${id}`)

export const getProcessedTransactionsRequest = async (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', `${start}T00:00:00-05:00`);
    if (end)   params.append('end',   `${end}T23:59:59-05:00`);
    const qs = params.toString();
    return axios.get(`/api/transactions/processed${qs ? `?${qs}` : ''}`);
};

export const postAccountTransactionRequest = async (data) =>
    await axios.post('/api/transactions/account', data)

export const getAccountTransactionsRequest = async () =>
    await axios.get('/api/transactions/accounts')

export const postAccountPaymentRequest = async (txId, data) =>
    await axios.post(`/api/transactions/${txId}/payment`, data)
