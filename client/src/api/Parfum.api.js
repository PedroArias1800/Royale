import axios from 'axios'

export const getParfumVersionRequest = async (id) => 
    await axios.get(`http://localhost:4001/parfum?id=${id}`);

export const getParfumsRequest = async () => 
    await axios.get('http://localhost:4001/parfums');

export const getParfumsBodyRequest = async () => 
    await axios.get('http://localhost:4001/parfums/body');

// export const insertProductRequest = async (product) => 
//     await axios.post('http://localhost:4001/product', product);

// export const updateProductRequest = async (id, product) =>
//     await axios.put(`http://localhost:4001/product/${id}`, product);

// export const deleteProductRequest = async (id) => 
//     await axios.delete(`http://localhost:4001/product${id}`);
