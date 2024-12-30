import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const getParfumsRequest = async () =>
    await axios.get(`${URL}/api/parfums`)

export const getTypesRequest = async () =>
    await axios.get(`${URL}/api/types`)

export const getBodiesRequest = async () =>
    await axios.get(`${URL}/api/bodies`)

export const getBrandsRequest = async () =>
    await axios.get(`${URL}/api/brands`)

export const getVersionsRequest = async () =>
    await axios.get(`${URL}/api/versions`)
