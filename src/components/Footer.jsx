import { HashLink } from 'react-router-hash-link'

export const Footer = () => {
  return (
    <footer className="footer">
        <div className="footer-container">
            <HashLink to={'#MasBuscados'} className="footer-logo">
                <img src="logos/RoyaleDorado.webp" alt="Royale Logo" />
            </HashLink>
            <p className="footer-description">
                Royale - Venta de perfumes y fragancias exclusivas para todos los gustos.
            </p>
            <div className="footer-links">
                <a href="/privacidad-de-datos.html">Privacidad de Datos</a>
                <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>
            </div>
            <p className="footer-rights">© 2024 Royale. Todos los derechos reservados.</p>
        </div>
    </footer>
  )
}
