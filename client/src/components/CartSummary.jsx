import { useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Link } from 'react-router-dom';
import { ParfumContext } from "../context/ParfumContext";
const URLServer = import.meta.env.VITE_SERVER_URL || 'https://api.royalepanama.com'
const URLFrontend = import.meta.env.VITE_FRONTEND_URL || 'http://93.188.162.15:5173'

export const CartSummary = ({ product }) => {
  // Estado para mostrar el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [nodeDrop, setNodeDrop] = useState({});

  // Obtén las funciones y el estado del carrito del contexto
  const { cart, addToCart, decreaseQuantity, removeFromCart } = useContext(ParfumContext);

  // Encuentra la cantidad del producto en el carrito
  const currentItem = cart.find(
    (item) => item.id === product.parfum._id && item.types_id === product.type._id
  );
  const cantidad = currentItem ? currentItem.quantity : 1;

  // Incrementar la cantidad
  const incrementQuantity = () => {
    addToCart(product.parfum._id, product.type._id, 1); // Incrementa en 1
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

  return (
    <div className='originalProductCart'>
      <div className="productCart">
        <div className="divImgProductCart">
          <Link to={`${URLFrontend}/parfum?id=${product.parfum._id}`} >
            <img
              src={`${URLServer}${product.type.img}`}
              alt={`Imagen de ${product.parfum.brand_id_fk.brand_name} ${product.parfum.title}`}
            />
          </Link>
        </div>
        <div className="divInfoProductCart">
          <div className='titleProduct'>
            <h3>
              {product.parfum.brand_id_fk.brand_name} {product.parfum.title}
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
                <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${Number(product.type.price).toFixed(2)}</p>
              </div>
              <p className='cardDiscount'>
                {Math.ceil(-100 + (100 / Number(product.type.old_price).toFixed(2)) * Number(product.type.price).toFixed(2))}%
              </p>
            </div>
            <div className='editQuantity'>
              <p>Cantidad:{cantidad}</p>
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
