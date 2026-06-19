import LogoRoyale from '/logos/RoyaleDorado.svg';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser, faHeart, faCartShopping, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useState, useEffect } from 'react';
import { useParfum } from "../context/ParfumContext";
import { CartDrawer } from './CartDrawer';

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { getTotalQuantity } = useParfum();

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && menuOpen && closeMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <div className='headerGeneral' id='Top'>
        <HashLink to={'/#MasBuscados'} className="LinkMasBuscados">
          <img src={LogoRoyale} alt="Logo de Royale" className='logoRoyale'/>
        </HashLink>

        {/* ── Desktop nav ── */}
        <nav className='navHeader'>
          <Link to="/search?type=1" onClick={() => window.scrollTo(0, 0)}>
            <FontAwesomeIcon icon={faUser} /> Damas
          </Link>
          <Link to="/search?type=2" onClick={() => window.scrollTo(0, 0)}>
            <FontAwesomeIcon icon={faHeart} /> Caballeros
          </Link>
          <button
            className="cart-icon nav-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Abrir carrito"
          >
            <FontAwesomeIcon icon={faCartShopping} /> Mi cesta
            {getTotalQuantity() > 0 && (
              <span className="cart-item-count">{getTotalQuantity()}</span>
            )}
          </button>
          <Link to="/search" onClick={() => window.scrollTo(0, 0)}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </Link>
        </nav>

        {/* ── Mobile controls ── */}
        <div className="hm-mobile-controls">
          <button
            className="hm-cart-mobile"
            onClick={() => setCartOpen(true)}
            aria-label="Abrir carrito"
          >
            <FontAwesomeIcon icon={faCartShopping} />
            {getTotalQuantity() > 0 && (
              <span className="cart-item-count">{getTotalQuantity()}</span>
            )}
          </button>
          <button
            className={`hamburger-icon ${menuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ── Fullscreen overlay menu ── */}
      <div
        className={`hm-overlay ${menuOpen ? 'hm-overlay--open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label="Menú de navegación"
      >
        <button className="hm-overlay__close" onClick={closeMenu} aria-label="Cerrar menú">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="hm-overlay__logo-wrap">
          <img src={LogoRoyale} alt="Royale" className="hm-overlay__logo" />
        </div>

        <div className="hm-overlay__ornament">
          <span className="hm-overlay__orn-line" />
          <span className="hm-overlay__orn-gem">◆</span>
          <span className="hm-overlay__orn-line" />
        </div>

        <nav className="hm-overlay__nav">
          <Link
            to="/search?type=1"
            className="hm-overlay__link"
            style={{ '--i': 0 }}
            onClick={() => { closeMenu(); window.scrollTo(0, 0); }}
          >
            <span className="hm-overlay__link-num">01</span>
            <span className="hm-overlay__link-text">Damas</span>
          </Link>
          <Link
            to="/search?type=2"
            className="hm-overlay__link"
            style={{ '--i': 1 }}
            onClick={() => { closeMenu(); window.scrollTo(0, 0); }}
          >
            <span className="hm-overlay__link-num">02</span>
            <span className="hm-overlay__link-text">Caballeros</span>
          </Link>
          <Link
            to="/search"
            className="hm-overlay__link"
            style={{ '--i': 2 }}
            onClick={() => { closeMenu(); window.scrollTo(0, 0); }}
          >
            <span className="hm-overlay__link-num">03</span>
            <span className="hm-overlay__link-text">Buscar</span>
          </Link>
          <button
            className="hm-overlay__link hm-overlay__link--cart"
            style={{ '--i': 3 }}
            onClick={() => { closeMenu(); setCartOpen(true); }}
          >
            <span className="hm-overlay__link-num">04</span>
            <span className="hm-overlay__link-text">
              Mi Cesta
              {getTotalQuantity() > 0 && (
                <span className="hm-overlay__cart-badge">{getTotalQuantity()}</span>
              )}
            </span>
          </button>
        </nav>

        <p className="hm-overlay__footer">
          © {new Date().getFullYear()} Royale Panama · Todos los derechos reservados
        </p>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
