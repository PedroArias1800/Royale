import axios from './axios.js'

export const postBrandsRequest = async (brand) =>
    await axios.post(`/api/brand`, brand)

export const putBrandsRequest = async (id, brand) =>
    await axios.put(`/api/brand/${id}`, brand)

export const deleteBrandsRequest = async (id) =>
    await axios.delete(`/api/brand`, id)