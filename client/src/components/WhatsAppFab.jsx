import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const HIDDEN_PATHS = ['/cart'];

const getWhatsAppUrl = () => {
    const phone = '50765623382';
    const text = encodeURIComponent('Hola, me gustaría consultar sobre un producto de Royale Panama✨.');
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
        return `whatsapp://send?phone=${phone}&text=${text}`;
    }
    return `https://wa.me/${phone}?text=${text}`;
};

export const WhatsAppFab = () => {
    const { pathname } = useLocation();

    if (HIDDEN_PATHS.includes(pathname)) return null;

    return (
        <a
            href={getWhatsAppUrl()}
            className="wa-fab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
        >
            <FontAwesomeIcon icon={faWhatsapp} />
        </a>
    );
};
