import LogoRoyale from '/logos/RoyaleDorado.svg';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser, faHeart, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useState } from 'react';
import { useParfum } from "../context/ParfumContext";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getTotalQuantity } = useParfum();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
return (
    <div className='headerGeneral' id='Top'>
        <HashLink to={'/#MasBuscados'} className="LinkMasBuscados">
          <img src={LogoRoyale} alt="Logo de Royale" className='logoRoyale'/>
        </HashLink>
        <nav className='navHeader'>
            <Link to="/search?type=1"><FontAwesomeIcon icon={faUser} /> Damas</Link>
            <Link to="/search?type=2"><FontAwesomeIcon icon={faHeart} /> Caballeros</Link>
            <Link to="/cart" className='cart-icon'>
              <FontAwesomeIcon icon={faCartShopping} /> Mi cesta
              { getTotalQuantity() > 0 && (
                <span className="cart-item-count">{getTotalQuantity()}</span>
              )}
            </Link>
            <Link to="/search"><FontAwesomeIcon icon={faMagnifyingGlass} /></Link>
        </nav>
        <div style={{'display': 'none'}} className="hamburger-menu">
          <button 
            className={`hamburger-icon ${isOpen ? 'open' : ''}`} 
            onClick={toggleMenu} 
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div style={{'display': 'none'}} className={`menuDesplegable ${isOpen ? 'menu-open' : ''}`}>
          <div className="hamburger-icon-mini">
            {/* Botón Hamburguesa */}
            <button 
              className={`hamburger-icon ${isOpen ? 'open' : ''}`} 
              onClick={toggleMenu} 
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
        </div>
          <ul>
              <li onClick={toggleMenu}>
                  <Link to="/search">
                      <FontAwesomeIcon icon={faMagnifyingGlass}/>
                  </Link>
              </li>
              <li onClick={toggleMenu}><Link to="/search?type=1"><FontAwesomeIcon icon={faUser} /> Damas</Link></li>
              <li onClick={toggleMenu}><Link to="/search?type=2"><FontAwesomeIcon icon={faHeart} /> Caballeros</Link></li>
              <li onClick={toggleMenu}>
                <Link to="/cart" className='cart-icon'>
                  <FontAwesomeIcon icon={faCartShopping} /> Mi cesta
                  { getTotalQuantity() > 0 && (
                    <span className="cart-item-count">{getTotalQuantity()}</span>
                  )}
                </Link>
              </li>
          </ul>
          <p className='derechosReservadosMini'>© 2024 Royale. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}