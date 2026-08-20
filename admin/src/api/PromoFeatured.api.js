import axios from './axios.js'

export const getPromoFeaturedRequest = () =>
    axios.get('/api/types/promo-featured');

export const putPromoFeaturedRequest = (ids) =>
    axios.put('/api/types/promo-featured', { ids });

export const getAllTypesRequest = () =>
    axios.get('/api/types/all');
