import { useState, useEffect } from 'react';
import { useParfum } from '../context/ParfumContext'

export const BannerPromos = ({ data }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [intervalId, setIntervalId] = useState(null);
    const { URLServer } = useParfum();

    // Iniciar el contador cada 5 segundos
    useEffect(() => {
        const newIntervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
        }, 2000); // Cambiar cada 5 segundos

        setIntervalId(newIntervalId); // Guardamos el id del intervalo

        return () => clearInterval(newIntervalId); // Limpiar el intervalo cuando el componente se desmonte
    }, [data.length]);

    // Cambiar el índice hacia adelante
    const goForward = () => {
        clearInterval(intervalId); // Limpiar el intervalo actual
        setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length); // Ir hacia adelante
        restartInterval(); // Reiniciar el intervalo
    };

    // Cambiar el índice hacia atrás
    const goBackward = () => {
        clearInterval(intervalId); // Limpiar el intervalo actual
        setCurrentIndex((prevIndex) => (prevIndex - 1 + data.length) % data.length); // Ir hacia atrás
        restartInterval(); // Reiniciar el intervalo
    };

    // Reiniciar el intervalo
    const restartInterval = () => {
        const newIntervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
        }, 5000); // Reiniciar cada 5 segundos
        setIntervalId(newIntervalId); // Actualizar el id del intervalo
    };

    return (
        <div className="banner-carousel-container">
            <div
                className="banner-carousel"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {data.map((item, index) => (
                    <div key={index} className="banner-carousel-item">
                        {item.media.endsWith('.mp4') ? (
                            <video
                                src={`${URLServer}${item.media}`}
                                autoPlay={true}
                                loop={true}
                                alt={`Video de la promoción ${item.title}`}
                                className="banner-carousel-media"
                            />
                        ) : (
                            <img
                                src={`${URLServer}${item.media}`}
                                alt={`Imagen de la promoción ${item.title}`}
                                className="banner-carousel-media banner-carousel-img"
                                style={{width: '100% !important'}}
                            />
                        )}
                    </div>
                ))}
            </div>
            <button className="carousel-btn prev-btn" onClick={goBackward}>
                &#10094;
            </button>
            <button className="carousel-btn next-btn" onClick={goForward}>
                &#10095;
            </button>
        </div>
    );
};
