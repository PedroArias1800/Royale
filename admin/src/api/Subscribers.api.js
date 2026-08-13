import axios from './axios'

export const getSubscribersRequest = async () =>
    await axios.get('/api/subscribers')

export const deleteSubscriberRequest = async (id) =>
    await axios.delete(`/api/subscribers/${id}`)
