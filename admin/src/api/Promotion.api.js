import axios from './axios.js'

export const postPromotionsRequest = async (promotion) =>
    await axios.post(`/api/promotion`, promotion, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const putPromotionsRequest = async (id, promotion) =>
    await axios.put(`/api/promotion/${id}`, promotion, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const deletePromotionsRequest = async (id) =>
    await axios.delete(`/api/promotion/${id}`)