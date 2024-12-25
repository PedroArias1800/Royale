import React, { useEffect, useState, useContext } from 'react';
import { CartSummary } from '../components/CartSummary';
import { CartResume } from '../components/CartResume';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { postCartRequest } from '../api/Cart.api.js';
import { ParfumContext } from "../context/ParfumContext";
import { Alert } from '../components/Alert.jsx';

export const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTotalQuantity, alertMessage, color, color2, setAlertMessage } = useContext(ParfumContext);

  // Cargar el carrito del localStorage y obtener los datos desde la API
  useEffect(() => {
    const fetchCartProducts = async () => {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      if (storedCart.length > 0) {
        try {
          const cartData = storedCart.map(item => ({
            id: item.id,
            types_id: item.types_id
          }));
          const response = await postCartRequest(JSON.stringify(cartData));
          const data = response.data;
          setCart(data);
        } catch (error) {
          console.error('Error al obtener los productos:', error);
        }
      }
      setLoading(false);
    };

    fetchCartProducts();
  }, []);


  return (
    <div className='cart'>
      <section className='cartSection1'>
        <div className='mostrarAlerta'>
          <Alert message={alertMessage} color={color} color2={color2} onClose={() => setAlertMessage("")}/>
        </div>
        <h2>TODOS LOS ARTÍCULOS ({getTotalQuantity() || 0})</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : getTotalQuantity() === 0 ? ( // Verificamos si el carrito está vacío
          <div className="cestaVacia">
            <div className='div1'>
              <FontAwesomeIcon icon={faShoppingCart} />
              <h2>Tu cesta está vacía</h2>
            </div>
            <div className="div2">
              <Link to='/search'>Comprar Ahora</Link>
            </div>
          </div>
        ) : (
          <div className='listCart'>
            {
              cart.map((item, index) => (
                <CartSummary key={index} product={item} />
              ))
            }
          </div>
        )}
      </section>
      {/* {
        getTotalQuantity() !== 0 ? (
        <section className='resumenCart'>
          <CartResume products={cart} />
        </section>

        ) : (
          <></>
        )
      } */}
    </div>
  );
};
