import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Link } from 'react-router-dom';
import { useParfum } from '../context/ParfumContext'
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons'


export const CartSummary = ({ product }) => {
  // Estado para mostrar el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [nodeDrop, setNodeDrop] = useState({});
  const { cart, addToCart, decreaseQuantity, removeFromCart, URLServer, URLFrontend } = useParfum();
  const [actualPrice, setActualPrice] = useState(product?.type?.price);
  const [validFlash, setValidFlash] = useState(product?.type?.type_of_sale == 'Flash' && product?.type?.quantity_flash > 0)

  useEffect(() => {
    if (validFlash)
    setActualPrice(product?.type?.price_flash)
  }, [product, validFlash]);

  // Encuentra la cantidad del producto en el carrito
  const currentItem = cart.find(
    (item) => item.id === product.parfum._id && item.types_id === product.type._id
  );
  const cantidad = currentItem ? currentItem.quantity : 1;

  // Incrementar la cantidad
  const incrementQuantity = () => {
    if (validFlash){
      addToCart(product.parfum._id, product.type._id, 1, product.type.quantity_flash); // Incrementa en 1 y máximo hasta la cantidad establecida de productos flash 
    } else {
      addToCart(product.parfum._id, product.type._id, 1, 10); // Incrementa en 1 y máximo hasta 10
    }
  };

  // Disminuir la cantidad
  const decrementQuantity = () => {
    decreaseQuantity(product.parfum._id, product.type._id); // Disminuye la cantidad
  };

  // Eliminar el producto del carrito
  const handleRemove = (event) => {
    // Mostrar el modal de confirmación
    setNodeDrop(event)
    setShowModal(true);
  };

  // Confirmar la eliminación del producto
  const confirmRemove = () => {
    // Eliminar el producto del carrito en el contexto
    removeFromCart(product.parfum._id, product.type._id);

    // Eliminar el contenedor HTML del producto
    const productContainer = nodeDrop.target.closest('.productCart');
    if (productContainer) {
      productContainer.remove();
    }

    // Cerrar el modal después de la eliminación
    setShowModal(false);
  };

  // Cancelar la eliminación y cerrar el modal
  const cancelRemove = () => {
    setShowModal(false);
  };

  const gradientStyle = {
    background: "linear-gradient(to bottom, #720c33, var(--color-rojo))",
    WebkitBackgroundClip: "text", // Clipa el fondo al texto
    WebkitTextFillColor: "transparent", // Hace el texto transparente
    fontWeight: "bold", // Opcional: destaca el texto
  };

  return (
    <div className='originalProductCart'>
      <div className="productCart">
        <div className="divImgProductCart">
          <Link to={`${URLFrontend}/parfum?id=${product.parfum._id}`}>
            <img
              src={`${URLServer}${product.type.img}`}
              alt={`Imagen de ${product.parfum.brand_id_fk.brand_name} ${product.parfum.title}`}
              className={`${validFlash ? 'demo animated' : ''}`}
              style={{'border': validFlash ? '6px solid transparent' : 'none'}} 
            />
          </Link>
        </div>
        <div className="divInfoProductCart">
          <div className='titleProduct'>
            <h3>
              {product.parfum.brand_id_fk.brand_name} {product.parfum.title}
              {
                (validFlash) && (
                  <FontAwesomeIcon icon={faBoltLightning} style={gradientStyle} className='boltFlash cartBoltFlash' />
                )
              }

            </h3>
            <Link to={`/search?type=${product.parfum.gender}`}>
              {product.parfum.gender === 1 ? 'Damas' : 'Caballeros'}
            </Link>
          </div>
          <h5>
            {product.parfum.version_id_fk.version_name} - {product.type.ml}ml
          </h5>
          <div className="productCardInfo2">
            <div className="cardInfo1">
              <div>
                <p className="price" style={{'textDecoration': 'line-through', 'margin': 'auto 0'}}>${Number(product.type.old_price).toFixed(2)}</p>
                <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${Number(actualPrice).toFixed(2)}</p>
              </div>
              <p className='cardDiscount'>
                {Math.ceil(-100 + (100 / Number(product.type.old_price).toFixed(2)) * Number(actualPrice).toFixed(2))}%
              </p>
            </div>
            <div className='editQuantity'>
              <div style={{textAlign: 'right'}}>
                <p>Cantidad:{cantidad}</p>
                {
                  (validFlash) && (
                    <p style={{color: 'red', fontSize: '.8rem'}}>Solo {product.type.quantity_flash} disponibles</p>
                  )
                }
              </div>
              <div className="cardInfo2">
                <button onClick={incrementQuantity}>+</button>
                <button onClick={decrementQuantity}>-</button>
                <button onClick={handleRemove}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="modal">
          <div className="modalContent">
            <h3>¿Estás seguro de que deseas eliminar este producto?</h3>
            <div className="modalActions">
              <button onClick={confirmRemove}>Sí</button>
              <button onClick={cancelRemove}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
