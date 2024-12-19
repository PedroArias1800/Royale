import axios from 'axios'

export const getParfumVersionRequest = async (id) => 
    await axios.get(`http://localhost:4001/parfum?id=${id}`);

export const getParfumsRequest = async () => 
    await axios.get('http://localhost:4001/parfums');

export const getParfumsBodyRequest = async () => 
    await axios.get('http://localhost:4001/parfums/body');
