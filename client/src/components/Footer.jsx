import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { useParfum } from '../context/ParfumContext';

export const Footer = () => {
    const { openModal } = useParfum();

    const returnWhatsapp = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
            return `whatsapp://send?phone=50765623382&text=Hola,%20estoy%20interesado%20en%20algunos%20productos`;
        }
        return `https://wa.me/+50765623382?text=Hola,%20estoy%20interesado%20en%20algunos%20productos%20de%20Royale%20Panama`;
    };

    return (
        <footer className="siteFooter">
            <div className="footerDivider">
                <span className="footerDivider-line" />
                <span className="footerDivider-ornament">◆</span>
                <span className="footerDivider-line" />
            </div>

            <div className="footerBody">
                <div className="footerCol footerCol--brand">
                    <HashLink to="/#MasBuscados" className="footerMainLogo">
                        <img src="icons/RoyalePanama2.png" alt="Royale Panama" />
                    </HashLink>
                    <div className="footerLogoSep">
                        <span className="footerLogoSep-line" />
                        <span className="footerLogoSep-gem">◆</span>
                        <span className="footerLogoSep-line" />
                    </div>
                    <HashLink to="/#MasBuscados" className="footerBrandLogo">
                        <img src="logos/RoyaleDorado.webp" alt="Royale Panama" />
                    </HashLink>
                    <p className="footerTagline">
                        Fragancias que definen el carácter.<br />
                        Lujo accesible desde Panamá.
                    </p>
                </div>

                <div className="footerCol">
                    <h4 className="footerColTitle">Explorar</h4>
                    <nav className="footerNav">
                        <Link to="/" onClick={() => window.scrollTo(0, 0)}>Inicio</Link>
                        <Link to="/search?type=Mujer" onClick={() => window.scrollTo(0, 0)}>Perfumes Mujer</Link>
                        <Link to="/search?type=Hombre" onClick={() => window.scrollTo(0, 0)}>Perfumes Hombre</Link>
                        <Link to="/search" onClick={() => window.scrollTo(0, 0)}>Buscar</Link>
                        <Link to="/cart" onClick={() => window.scrollTo(0, 0)}>Carrito</Link>
                    </nav>
                </div>

                <div className="footerCol">
                    <h4 className="footerColTitle">Redes Sociales</h4>
                    <div className="footerSocial">
                        <Link
                            to="https://www.instagram.com/royalepanama1/profilecard/?igsh=MXNja3JyeWZ4a3RqYg=="
                            target="_blank"
                            className="footerSocialLink"
                        >
                            <FontAwesomeIcon icon={faInstagram} />
                            <span>@RoyalePanama1</span>
                        </Link>
                        <Link
                            to={returnWhatsapp()}
                            className="footerSocialLink"
                        >
                            <FontAwesomeIcon icon={faWhatsapp} />
                            <span>+507 6562-3382</span>
                        </Link>
                    </div>
                </div>

                <div className="footerCol">
                    <h4 className="footerColTitle">Contacto</h4>
                    <div className="footerContact">
                        <Link
                            to="mailto:royalepanama321@gmail.com?subject=Consulta%20sobre%20Productos%20Royale%20Panama&body=Hola,%20me%20gustaría%20obtener%20más%20información%20sobre..."
                            className="footerContactItem"
                        >
                            <FontAwesomeIcon icon={faEnvelope} />
                            <span>royalepanama321@gmail.com</span>
                        </Link>
                        <div className="footerContactItem footerContactItem--static">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <span>Ciudad de Panamá, Panamá</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footerBottom">
                <p className="footerCopyright">© 2025 Royale Panama. Todos los derechos reservados.</p>
                <div className="footerLegal">
                    <button onClick={() => openModal('privacy')}>Privacidad</button>
                    <span className="footerLegal-sep">·</span>
                    <button onClick={() => openModal('terms')}>Términos</button>
                </div>
            </div>
        </footer>
    );
};
