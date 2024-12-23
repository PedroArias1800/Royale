import React, { useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Link } from 'react-router-dom';
import { ParfumContext } from "../context/ParfumContext";

export const CartSummary = ({ product }) => {
  // Estado para mostrar el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [nodeDrop, setNodeDrop] = useState({});

  // Obtén las funciones y el estado del carrito del contexto
  const { cart, addToCart, decreaseQuantity, removeFromCart } = useContext(ParfumContext);

  // Encuentra la cantidad del producto en el carrito
  const currentItem = cart.find(
    (item) => item.id === product.parfum_id.toString() && item.types_id === product.types_id.toString()
  );
  const cantidad = currentItem ? currentItem.quantity : 1;

  // Incrementar la cantidad
  const incrementQuantity = () => {
    addToCart(product.parfum_id.toString(), product.types_id.toString(), 1); // Incrementa en 1
  };

  // Disminuir la cantidad
  const decrementQuantity = () => {
    decreaseQuantity(product.parfum_id.toString(), product.types_id.toString()); // Disminuye la cantidad
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
    removeFromCart(product.parfum_id.toString(), product.types_id.toString());

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

  return (
    <div className='originalProductCart'>
      <div className="productCart">
        <div className="divImgProductCart">
          <Link to={`/parfum?id=${product.parfum_id}`}>
            <img
              src={`/parfum/${product.img}`}
              alt={`Imagen de ${product.brand} ${product.title}`}
            />
          </Link>
        </div>
        <div className="divInfoProductCart">
          <div className='titleProduct'>
            <h3>
              {product.brand_name} {product.title}
            </h3>
            <Link to={`/search?type=${product.gender}`}>
              {product.gender === 1 ? 'Damas' : 'Caballeros'}
            </Link>
          </div>
          <h5>
            Versión {product.version_name} - {product.ml}ml
          </h5>
          <div className="productCardInfo2">
            <div className="cardInfo1">
              <p className="price" style={{'textDecoration': 'line-through', 'margin': 'auto 0'}}>${product.old_price.toFixed(2)}</p>
              <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${product.price.toFixed(2)}</p>
              <p className='cardDiscount'>
                {Math.ceil(-100 + (100 / product.old_price.toFixed(2)) * product.price.toFixed(2))}%
              </p>
            </div>
            <div className='editQuantity'>
              <p>Cantidad: {cantidad}</p>
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
