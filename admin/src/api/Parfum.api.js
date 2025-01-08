import axios from './axios.js'

export const postParfumsRequest = async (parfum) => 
    await axios.post(`/api/parfum`, parfum, {
        headers: { 'Content-Type': 'application/json' }
    })

export const putParfumsRequest = async (id, parfum) =>
    await axios.put(`/api/parfum/${id}`, parfum, {
        headers: { 'Content-Type': 'application/json' }
    })

export const deleteParfumsRequest = async (id) =>
    await axios.delete(`/api/parfum/${id}`)   