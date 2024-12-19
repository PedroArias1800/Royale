import { HashLink } from 'react-router-hash-link'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';


export const Footer = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', text: '' });

    const handleButtonClick = (type) => {
        const content = {
            title: type === 'privacy' ? 'Privacidad de Datos' : 'Términos y Condiciones',
            text:
                type === 'privacy'
                    ? 'Esta es la política de privacidad, donde explicamos cómo manejamos tus datos personales.'
                    : 'Estos son los términos y condiciones, donde detallamos las reglas para usar nuestro sitio web.',
        };
        setModalContent(content);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

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
                    <Link to="#">
                        <FontAwesomeIcon icon={faWhatsapp} />
                        <p>RoyalePanama1</p>
                    </Link>
                </section>
            </div>
            <div>
                <h3>CONTACTO</h3>
                <div className='imgRedesSociales'>
                    <Link to="#">
                        <FontAwesomeIcon icon={faEnvelope} style={{"width": '70%'}}/>
                        <p>royalepanama1@gmail.com</p>
                    </Link>
                </div>
            </div>
            <div>
                <h3>UBICACIÓN</h3>
                <p>
                    Panamá, Provincia de Panamá;<br/>
                    Panamá Norte, Las Cumbres.
                </p>
            </div>
        </div>
        <footer className="footer">
            <div className="footer-container">
                <HashLink to={'/#MasBuscados'} className="footer-logo">
                    <img src="logos/RoyaleDorado.webp" alt="Royale Logo" />
                </HashLink>
                <div className="footer-links">
                    <button onClick={() => handleButtonClick('privacy')}>Privacidad de Datos</button>
                    <button onClick={() => handleButtonClick('terms')}>Términos y Condiciones</button>
                </div>
                <p className="footer-rights">© 2024 Royale. Todos los derechos reservados.</p>
            </div>
        </footer>
        {/* Modal */}
        {isModalOpen && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{modalContent.title}</h2>
                    <p>{modalContent.text}</p>
                    <button onClick={handleCloseModal} className="accept-button">
                        Aceptar
                    </button>
                </div>
            </div>
        )}
    </>
  )
}
