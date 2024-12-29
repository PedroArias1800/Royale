import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { ParfumContext } from '../context/ParfumContext';
import { useContext } from 'react';

export const Footer = () => {
    const { openModal } = useContext(ParfumContext);

    return (
        <>
            <div className='semiFooter'>
                <div>
                    <HashLink to={'/#MasBuscados'}>
                        <img className='logoRoyaleFooter' src="Royale.png" alt="Logo de Royale"/>
                    </HashLink>
                </div>
                <div>
                    <h3>REDES SOCIALES</h3>
                    <section className='imgRedesSociales'>
                        <Link to="https://www.instagram.com/royalepanama1/profilecard/?igsh=MXNja3JyeWZ4a3RqYg==" target='_blank'>
                            <FontAwesomeIcon icon={faInstagram} />
                            <p>@RoyalePanama1</p>
                        </Link>
                        <Link to="#">
                            <FontAwesomeIcon icon={faTwitter} />
                            <p>@RoyalePanama1</p>
                        </Link>
                        <Link to={`whatsapp://send?phone=50765623382&text=Hola,%20estoy%20interesado%20en%20algunos%20productos`}>
                            <FontAwesomeIcon icon={faWhatsapp} />
                            <p>+507 6562-3382</p>
                        </Link>
                    </section>
                </div>
                <div>
                    <h3>CONTACTO</h3>
                    <div className='imgRedesSociales'>
                        <Link to="mailto:royalepanama321@gmail.com?subject=Consulta%20sobre%20Productos%20Royale%20Panama&body=Hola,%20me%20gustaría%20obtener%20más%20información%20sobre...">
                            <FontAwesomeIcon icon={faEnvelope} style={{"width": '70%'}}/>
                            <p>royalepanama321@gmail.com</p>
                        </Link>
                    </div>
                </div>
                <div>
                    <h3>UBICACIÓN</h3>
                    <p>
                        Panamá, Ciudad de Panamá<br/>
                    </p>
                </div>
            </div>
            <footer className="footer">
                <div className="footer-container">
                    <HashLink to={'/#MasBuscados'} className="footer-logo">
                        <img src="logos/RoyaleDorado.webp" alt="Royale Logo" />
                    </HashLink>
                    <div className="footer-links">
                        <button onClick={() => openModal('privacy')}>Privacidad de Datos</button>
                        <button onClick={() => openModal('terms')}>Términos y Condiciones</button>
                    </div>
                    <p className="footer-rights">© 2024 Royale. Todos los derechos reservados.</p>
                </div>
            </footer>
        </>
    );
};
