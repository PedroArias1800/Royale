import axios from './axios.js'

export const postProvidersRequest = async (provider) =>
    await axios.post(`/api/provider`, provider)

export const putProvidersRequest = async (id, provider) =>
    await axios.put(`/api/provider/${id}`, provider)

export const deleteProvidersRequest = async (id) =>
    await axios.delete(`/api/provider/${id}`)
