import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Link } from 'react-router-dom';
import { useParfum } from '../context/ParfumContext'
import { faBolt, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'


export const CartSummary = ({ product }) => {
  const [showModal, setShowModal] = useState(false);
  const [nodeDrop, setNodeDrop] = useState({});
  const { cart, addToCart, decreaseQuantity, removeFromCart, imgSrc, URLFrontend, getDiscount } = useParfum();
  const [validFlash] = useState(product?.type?.type_of_sale == 'Flash' && product?.type?.quantity_flash > 0);
  const basePrice = validFlash ? product?.type?.price_flash : product?.type?.price;
  const discountPct = (!validFlash && getDiscount) ? getDiscount(product?.parfum) : null;
  const actualPrice = discountPct
    ? parseFloat(basePrice) * (1 - discountPct / 100)
    : basePrice;

  const currentItem = cart.find(
    (item) => item.id === product.parfum._id && item.types_id === product.type._id
  );
  const cantidad = currentItem ? currentItem.quantity : 1;

  const incrementQuantity = () => {
    if (validFlash) {
      addToCart(product.parfum._id, product.type._id, 1, product.type.quantity_flash);
    } else {
      addToCart(product.parfum._id, product.type._id, 1, 10);
    }
  };

  const decrementQuantity = () => {
    decreaseQuantity(product.parfum._id, product.type._id);
  };

  const handleRemove = (event) => {
    setNodeDrop(event);
    setShowModal(true);
  };

  const confirmRemove = () => {
    removeFromCart(product.parfum._id, product.type._id);
    setShowModal(false);
  };

  const cancelRemove = () => setShowModal(false);

  return (
    <div className='originalProductCart'>
      <div className="pc-card">
        {/* Imagen */}
        <div className="pc-card__img-wrap">
          <Link to={`${URLFrontend}/parfum?id=${product.parfum._id}`}>
            <div
              className={validFlash ? 'demo animated pc-card__img-animated' : 'pc-card__img-animated'}
              style={validFlash ? { border: '5px solid transparent', borderRadius: '6px', display: 'inline-block' } : {}}
            >
              <img
                src={imgSrc(product.type.img)}
                alt={`${product.parfum.brand?.brand_name} ${product.parfum.title}`}
                className="pc-card__img"
              />
            </div>
          </Link>
          {validFlash && (
            <span className="pc-card__flash-badge">
              <FontAwesomeIcon icon={faBolt} /> Flash
            </span>
          )}
        </div>

        {/* Info */}
        <div className="pc-card__body">
          {/* Cabecera: nombre + género */}
          <div className="pc-card__head">
            <div>
              <p className="pc-card__brand">{product.parfum.brand_id_fk.brand_name}</p>
              <h3 className="pc-card__title">{product.parfum.title}</h3>
            </div>
            <Link to={`/search?type=${product.parfum.gender}`} className="pc-card__gender">
              {product.parfum.gender === 1 ? 'Damas' : 'Caballeros'}
            </Link>
          </div>

          {/* Versión + Precio en la misma fila */}
          <div className="pc-card__meta-row">
            <p className="pc-card__version">
              {product.parfum.version_id_fk.version_name} · {product.type.ml}ml
            </p>
            <div className="pc-card__price-block">
              {discountPct && (
                <span className="pc-card__price-old">${Number(basePrice).toFixed(2)}</span>
              )}
              <span className="pc-card__price-now">${Number(actualPrice).toFixed(2)}</span>
              {discountPct && (
                <span className="pc-card__disc-badge">−{discountPct}%</span>
              )}
            </div>
          </div>

          {validFlash && (
            <p className="pc-card__flash-stock">Solo {product.type.quantity_flash} disponibles</p>
          )}

          {/* Controles */}
          <div className="pc-card__controls">
            <div className="pc-card__qty">
              <button className="pc-card__qty-btn" onClick={decrementQuantity} aria-label="Disminuir">
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="pc-card__qty-count">{cantidad}</span>
              <button className="pc-card__qty-btn" onClick={incrementQuantity} aria-label="Aumentar">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <button className="pc-card__remove" onClick={handleRemove} aria-label="Eliminar producto">
              <FontAwesomeIcon icon={faTrash} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && cancelRemove()}>
          <div className="modalContent">
            <div className="modal-icon">🗑</div>
            <h3 className="modal-title">¿Eliminar producto?</h3>
            <p className="modal-desc">
              <strong>{product.parfum.brand?.brand_name} {product.parfum.title}</strong>
              <br />será eliminado de tu cesta.
            </p>
            <div className="modalActions">
              <button className="modalActions__confirm" onClick={confirmRemove}>Sí, eliminar</button>
              <button className="modalActions__cancel" onClick={cancelRemove}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
