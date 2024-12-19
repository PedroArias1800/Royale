import axios from 'axios'

export const postCartRequest = async (cart) =>
    await axios.post(`http://localhost:4001/cart`, cart, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });
