import LogoRoyale from '/logos/RoyaleNegro.svg';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser, faHeart, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

export const Header = () => {
  return (
    <div className='headerGeneral'>
        <HashLink to={'#MasBuscados'} className="LinkMasBuscados">
          <img src={LogoRoyale} alt="Logo de Royale" className='logoRoyale'/>
        </HashLink>
        <nav className='navHeader'>
            <Link to="#"><FontAwesomeIcon icon={faUser} /> Iniciar Sesión</Link>
            <Link to="#"><FontAwesomeIcon icon={faHeart} /> Lista de Deseos</Link>
            <Link to="#"><FontAwesomeIcon icon={faCartShopping} /> Mi cesta</Link>
            <Link to="#"><FontAwesomeIcon icon={faMagnifyingGlass} /></Link>
        </nav>
    </div>
  )
}