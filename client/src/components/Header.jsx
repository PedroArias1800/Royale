import LogoRoyale from '/logos/RoyaleDorado.svg';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser, faHeart, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useState, useRef, useContext } from 'react';
import { ParfumContext } from "../context/ParfumContext";

export const Header = () => {
  const formRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInputValid, setIsInputValid] = useState(true); // Estado para la validación del input

  const { getTotalQuantity } = useContext(ParfumContext);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const submitForm = (event) => {
    event.preventDefault(); // Previene el envío del formulario por defecto

    // Obtener el valor del input
    const input = formRef.current.querySelector('input');

    // Verificar si el campo está vacío
    if (input.value.trim() === '') {
      setIsInputValid(false); // Cambiar el estado para indicar que el campo es inválido
    } else {
      setIsInputValid(true); // Campo válido, envía el formulario
      formRef.current.submit();
    }
  };

  const handleFocus = () => {
    setIsInputValid(true); // Restablece el estado a válido cuando el input recibe el foco
  };
  
return (
    <div className='headerGeneral' id='Top'>
        <HashLink to={'/#MasBuscados'} className="LinkMasBuscados">
          <img src={LogoRoyale} alt="Logo de Royale" className='logoRoyale'/>
        </HashLink>
        <nav className='navHeader'>
            <Link to="#"><FontAwesomeIcon icon={faUser} /> Iniciar Sesión</Link>
            <Link to="#"><FontAwesomeIcon icon={faHeart} /> Lista de Deseos</Link>
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
              <li>
                  <form ref={formRef} action='/search' method="post">
                      <input type="text" placeholder='Sauvage Dior' required 
                      className={isInputValid ? '' : 'invalid-input'} 
                      onFocus={handleFocus}/>
                      <FontAwesomeIcon icon={faMagnifyingGlass} onClick={submitForm} />
                  </form>
              </li>
              <li><Link to="#"><FontAwesomeIcon icon={faUser} /> Iniciar Sesión</Link></li>
              <li><Link to="#"><FontAwesomeIcon icon={faHeart} /> Lista de Deseos</Link></li>
              <li>
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