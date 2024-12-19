import React, { useEffect, useState } from 'react'
import { CartSummary } from '../components/CartSummary';
import { CartResume } from '../components/CartResume';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export const Cart = () => {

  const [cart, setCart] = useState([]);
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(storedCart);
  }, []);

  return (
    <div className='cart'>
      <section className='listCart'>
        <h2>TODOS LOS ARTÍCULOS ({totalItems})</h2>
        {
          cart.length === 0 ? (
            <div>
                <FontAwesomeIcon icon={faShoppingCart} />
                <h2>Tu cesta está vacía</h2>
                <Link to='/search'>Comprar Ahora</Link>
            </div>
        ) : (
          cart.map((item, index) => (
            <CartSummary key={index} product={item} />
          ))
        )}
        </section>
      <section className='resumenCart'>
        <CartResume />
      </section>
    </div>
  )
}
