import axios from './axios.js'

export const getParfumsRequest = async () =>
    await axios.get(`/api/parfums`)

export const getTypesRequest = async () =>
    await axios.get(`/api/types`)

export const getBodiesRequest = async () =>
    await axios.get(`/api/bodies`)

export const getBrandsRequest = async () =>
    await axios.get(`/api/brands`)

export const getVersionsRequest = async () =>
    await axios.get(`/api/versions`)
