import axios from './axios.js'

export const getDeliveryPricesRequest = async (page = 1) =>
    await axios.get(`/api/delivery?page=${page}`)

export const getAllDeliveryPricesRequest = async () =>
    await axios.get('/api/delivery/all')

export const postFilteredDeliveryRequest = async (page = 1, filter) =>
    await axios.post(`/api/delivery/filtered?page=${page}`, filter)

export const postDeliveryPriceRequest = async (data) =>
    await axios.post('/api/delivery', data)

export const putDeliveryPriceRequest = async (id, data) =>
    await axios.put(`/api/delivery/${id}`, data)

export const deleteDeliveryPriceRequest = async (id) =>
    await axios.delete(`/api/delivery/${id}`)
