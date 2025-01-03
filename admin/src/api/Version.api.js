import axios from './axios.js'

export const postVersionsRequest = async (version) =>
    await axios.post(`/api/version`, version)

export const putVersionsRequest = async (id, version) =>
    await axios.put(`/api/version/${id}`, version)

export const deleteVersionsRequest = async (id) =>
    await axios.delete(`/api/version`, id)