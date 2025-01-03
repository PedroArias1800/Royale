import axios from './axios.js'

export const postTypesRequest = async (type) =>
    await axios.post(`/api/type`, type, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegúrate de incluir este encabezado
        },
    });

export const putTypesRequest = async (id, type) =>
    await axios.put(`/api/type/${id}`, type, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegúrate de incluir este encabezado
        },
    });

export const deleteTypesRequest = async (id) =>
    await axios.delete(`/api/type`, id)