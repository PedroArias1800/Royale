import axios from './axios.js'

export const getParfumsGallery = async () =>
    await axios.get(`/api/img`)

export const getParfumsIconGallery = async () =>
    await axios.get(`/api/img/icon`)

export const getParfumsIconGallery2 = async () =>
    await axios.get(`/api/multiImg`)
