import React, { useMemo, useEffect, useState } from 'react';
import { useParfum } from '../context/ParfumContext';

export const CartResume = () => {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
      }, []);

    const { products } = useParfum();

    // Calcular los totales directamente con useMemo para optimizar
    const { totalItems, subTotal, totalPrice, totalSavings } = useMemo(() => {
        let subTotal = 0; // Precio original (oldPrice)
        let totalPrice = 0; // Precio final (price)
        let totalItems = 0;

        cart.forEach((item) => {
            const productData = products.Parfum.find((product) => product.id === item.id);
            if (productData) {
                const filteredType = productData.types.find((type) => type.idVersion === item.idVersion);
                if (filteredType) {
                    subTotal += filteredType.oldPrice * item.cantidad;
                    totalPrice += filteredType.price * item.cantidad;
                    totalItems += item.cantidad;
                }
            }
        });

        const totalSavings = subTotal - totalPrice;

        return { totalItems, subTotal, totalPrice, totalSavings };
    }, [cart, products]);

    return (
        <div className='cardResume'>
            <h2>Resumen del Pedido</h2>
            <div>
                <div className='liResumen'>
                    <p>Sub Total</p>
                    <p>${subTotal.toFixed(2)}</p>
                </div>
                <div className='liResumen'>
                    <p>Promociones</p>
                    <p>-${totalSavings.toFixed(2)}</p>
                </div>
                <hr />
                <div className='liResumen'>
                    <p>Total</p>
                    <p>${totalPrice.toFixed(2)}</p>
                </div>
                <div className='liResumen'>
                    <p>Has Ahorrado</p>
                    <p>${totalSavings.toFixed(2)}</p>
                </div>
            </div>
            <button className='comprar'>{`Comprar Ahora (${totalItems})`}</button>
        </div>
    );
};
