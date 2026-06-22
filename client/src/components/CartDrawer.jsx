import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faTrash, faBolt, faBagShopping, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useParfum } from '../context/ParfumContext';
import { postCartRequest } from '../api/Cart.api';

export const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, addToCart, decreaseQuantity, removeFromCart, getTotalQuantity, imgSrc } = useParfum();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const wasOpen = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (cart.length === 0) { setProducts([]); return; }
    setLoading(true);
    try {
      const payload = cart.map(item => ({ id: item.id, types_id: item.types_id }));
      const res = await postCartRequest(payload);
      const withQty = res.data.map(p => ({
        ...p,
        quantity: cart.find(c => c.id === p.parfum._id && c.types_id === p.type._id)?.quantity || 1,
      }));
      setProducts(withQty);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [cart]);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      fetchProducts();
    }
    wasOpen.current = isOpen;
  }, [isOpen, fetchProducts]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleIncrease = (parfumId, typeId, maxQty) => {
    addToCart(parfumId, typeId, 1, maxQty);
    setProducts(prev => prev.map(p =>
      p.parfum._id === parfumId && p.type._id === typeId && p.quantity < maxQty
        ? { ...p, quantity: p.quantity + 1 }
        : p
    ));
  };

  const handleDecrease = (parfumId, typeId) => {
    decreaseQuantity(parfumId, typeId);
    setProducts(prev => prev.map(p =>
      p.parfum._id === parfumId && p.type._id === typeId && p.quantity > 1
        ? { ...p, quantity: p.quantity - 1 }
        : p
    ));
  };

  const handleRemove = (parfumId, typeId) => {
    removeFromCart(parfumId, typeId);
    setProducts(prev => prev.filter(p =>
      !(p.parfum._id === parfumId && p.type._id === typeId)
    ));
  };

  const total = products.reduce((acc, p) => {
    const price = p.type.type_of_sale === 'Flash' && p.type.quantity_flash > 0
      ? p.type.price_flash : p.type.price;
    return acc + price * p.quantity;
  }, 0);

  return (
    <>
      <div
        className={`cdr-backdrop ${isOpen ? 'cdr-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`cdr ${isOpen ? 'cdr--open' : ''}`} aria-label="Carrito de compras">

        {/* ── Header ── */}
        <div className="cdr__head">
          <div className="cdr__head-title">
            <FontAwesomeIcon icon={faBagShopping} className="cdr__bag-icon" />
            <span>Mi Cesta</span>
            {getTotalQuantity() > 0 && (
              <span className="cdr__count">{getTotalQuantity()}</span>
            )}
          </div>
          <button className="cdr__close" onClick={onClose} aria-label="Cerrar">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* ── Ornamental divider ── */}
        <div className="cdr__ornament">
          <span className="cdr__ornament-line" />
          <span className="cdr__ornament-gem">◆</span>
          <span className="cdr__ornament-line" />
        </div>

        {/* ── Body ── */}
        <div className="cdr__body">
          {cart.length === 0 ? (
            <div className="cdr__empty">
              <FontAwesomeIcon icon={faBagShopping} className="cdr__empty-icon" />
              <p className="cdr__empty-title">Tu cesta está vacía</p>
              <p className="cdr__empty-sub">Descubre nuestra colección exclusiva</p>
              <Link to="/search" onClick={onClose} className="cdr__explore-btn">
                Explorar perfumes
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          ) : loading ? (
            <div className="cdr__loading">
              <div className="cdr__spinner" />
            </div>
          ) : (
            <ul className="cdr__list">
              {products.map((p, i) => {
                const isFlash = p.type.type_of_sale === 'Flash' && p.type.quantity_flash > 0;
                const price = isFlash ? p.type.price_flash : p.type.price;
                const brandName = p.parfum.brand?.brand_name ?? '';
                const versionName = p.parfum.version?.version_name ?? '';
                return (
                  <li key={`${p.parfum._id}-${p.type._id}-${i}`} className="cdr__item">
                    <Link to={`/parfum?id=${p.parfum._id}`} onClick={onClose} className="cdr__item-img-wrap">
                      <div
                        className={isFlash ? 'demo animated cdr__flash-border' : 'cdr__flash-border'}
                        style={isFlash ? { border: '6px solid transparent', borderRadius: '4px' } : {}}
                      >
                        <img src={imgSrc(p.type.img)} alt={p.parfum.title} className="cdr__item-img" />
                      </div>
                      {isFlash && (
                        <span className="cdr__flash-badge">
                          <FontAwesomeIcon icon={faBolt} />
                        </span>
                      )}
                    </Link>
                    <div className="cdr__item-body">
                      <p className="cdr__item-brand">{brandName}</p>
                      <Link to={`/parfum?id=${p.parfum._id}`} onClick={onClose} className="cdr__item-name">
                        {p.parfum.title}
                      </Link>
                      <p className="cdr__item-meta">{versionName} · {p.type.ml}ml</p>
                      {isFlash && (
                        <p className="cdr__item-stock">Solo {p.type.quantity_flash} disponibles</p>
                      )}
                      <div className="cdr__item-foot">
                        <div className="cdr__item-prices">
                          <span className="cdr__price-current">${(price * p.quantity).toFixed(2)}</span>
                        </div>
                        <div className="cdr__controls">
                          <button
                            className="cdr__qty-btn"
                            onClick={() => handleDecrease(p.parfum._id, p.type._id)}
                            aria-label="Disminuir"
                          >−</button>
                          <span className="cdr__qty">{p.quantity}</span>
                          <button
                            className="cdr__qty-btn"
                            onClick={() => handleIncrease(p.parfum._id, p.type._id, isFlash ? p.type.quantity_flash : 10)}
                            aria-label="Aumentar"
                          >+</button>
                          <button
                            className="cdr__remove"
                            onClick={() => handleRemove(p.parfum._id, p.type._id)}
                            aria-label="Eliminar producto"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        {cart.length > 0 && !loading && (
          <div className="cdr__footer">
            <div className="cdr__subtotal">
              <span className="cdr__subtotal-label">Subtotal</span>
              <span className="cdr__subtotal-amount">${total.toFixed(2)}</span>
            </div>
            <Link to="/cart" onClick={onClose} className="cdr__checkout">
              Proceder al Pago
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <button onClick={onClose} className="cdr__keep-shopping">
              Continuar comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
