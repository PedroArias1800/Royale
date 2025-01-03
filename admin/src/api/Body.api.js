import axios from './axios.js'

export const postBodiesRequest = async (body) =>
    await axios.post(`/api/body`, body, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegúrate de incluir este encabezado
        },
    });

export const putBodiesRequest = async (id, body) =>
    await axios.put(`/api/body/${id}`, body, {
        headers: {
            'Content-Type': 'multipart/form-data', // Asegúrate de incluir este encabezado
        },
    });

export const deleteBodiesRequest = async (id) =>
    await axios.delete(`/api/body`, id)