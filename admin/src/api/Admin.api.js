import axios from './axios.js'

export const getParfumsRequest = async (page = 1) =>
    await axios.get(`/api/parfums?page=${page}`)

export const getAllParfumsRequest = async () =>
    await axios.get(`/api/parfums/all`)

export const getTypesRequest = async (page = 1) =>
    await axios.get(`/api/types?page=${page}`)

export const getAllTypesRequest = async () =>
    await axios.get(`/api/types/all`)

export const getBodiesRequest = async (page = 1) =>
    await axios.get(`/api/bodies?page=${page}`)

export const getAllBodiesRequest = async () =>
    await axios.get(`/api/bodies/all`)

export const getBrandsRequest = async (page = 1) =>
    await axios.get(`/api/brands?page=${page}`)

export const getAllBrandsRequest = async () =>
    await axios.get(`/api/brands/all`)

export const getVersionsRequest = async (page = 1) =>
    await axios.get(`/api/versions?page=${page}`)

export const getAllVersionsRequest = async () =>
    await axios.get(`/api/versions/all`)

export const getUsersRequest = async (page = 1) =>
    await axios.get(`/api/users?page=${page}`)

export const getAllUsersRequest = async () =>
    await axios.get(`/api/users/all`)


export const getTransactionsRequest = async () =>
    await axios.get(`/transaction`, { 
        withCredentials: true
    });

export const putTransactionsRequest = async (id) =>
        await axios.put(`/transaction/${id}`)