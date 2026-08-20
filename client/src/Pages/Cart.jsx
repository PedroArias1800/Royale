import { useEffect, useState } from 'react';
import { CartSummary } from '../components/CartSummary';
import { CartResume } from '../components/CartResume';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faLock, faTruck, faGem } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { postCartRequest } from '../api/Cart.api.js';
import { useParfum } from "../context/ParfumContext";
import { Alert } from '../components/Alert.jsx';

const GUARANTEES = [
  { icon: faLock,  label: 'Pago seguro' },
  { icon: faTruck, label: 'Entrega en Panamá' },
  { icon: faGem,   label: 'Perfumes originales' },
];

export const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTotalQuantity, alertMessage, color, color2, setAlertMessage, cart: contextCart } = useParfum();

  useEffect(() => {
    document.title = 'Tu Carrito · Royale Panama';
    return () => { document.title = 'Royale Panama — Perfumes de Lujo en Panamá'; };
  }, []);

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

  // Sincronizar cuando se elimina un producto desde CartSummary
  useEffect(() => {
    if (loading) return;
    setCart(prev => prev.filter(item =>
      contextCart.some(c => c.id === item.parfum._id && c.types_id === item.type._id)
    ));
  }, [contextCart]);


  return (
    <div className='cart'>
      <section className='cartSection1'>
        <div className='mostrarAlerta'>
          <Alert message={alertMessage} color={color} color2={color2} onClose={() => setAlertMessage("")}/>
        </div>
        <h2>TODOS LOS ARTÍCULOS ({getTotalQuantity() || 0})</h2>
        {loading ? (
          <div className="cart-skeleton">
            {[1, 2, 3].map(i => (
              <div key={i} className="cart-skeleton__item">
                <div className="skeleton cart-skeleton__img" />
                <div className="cart-skeleton__info">
                  <div className="skeleton cart-skeleton__line cart-skeleton__line--title" />
                  <div className="skeleton cart-skeleton__line cart-skeleton__line--sub" />
                  <div className="skeleton cart-skeleton__line cart-skeleton__line--price" />
                </div>
              </div>
            ))}
          </div>
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
          <>
            <div className='listCart'>
              {cart.map((item, index) => (
                <CartSummary key={index} product={item} />
              ))}
            </div>
            <div className="cart-guarantees">
              {GUARANTEES.map(g => (
                <div key={g.label} className="cart-guarantees__item">
                  <FontAwesomeIcon icon={g.icon} className="cart-guarantees__icon" />
                  <span className="cart-guarantees__label">{g.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      {
        getTotalQuantity() !== 0 ? (
        <section className='resumenCart'>
          <CartResume products={cart} />
        </section>
        ) : (
          <></>
        )
      }
    </div>
  );
};
