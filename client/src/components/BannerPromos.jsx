import { useState, useEffect, useRef } from 'react';
import { useParfum } from '../context/ParfumContext'

export const BannerPromos = ({ data }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef(null);
    const { imgSrc } = useParfum();

    const startInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % data.length);
        }, 5000);
    };

    useEffect(() => {
        if (data.length === 0) return;
        startInterval();
        return () => clearInterval(intervalRef.current);
    }, [data.length]);

    const goForward = () => {
        setCurrentIndex(prev => (prev + 1) % data.length);
        startInterval();
    };

    const goBackward = () => {
        setCurrentIndex(prev => (prev - 1 + data.length) % data.length);
        startInterval();
    };

    if (data.length === 0) return null;

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
                                src={imgSrc(item.media)}
                                autoPlay={index === currentIndex}
                                loop={true}
                                muted={true}
                                playsInline={true}
                                preload={index === currentIndex ? 'metadata' : 'none'}
                                className="banner-carousel-media"
                            />
                        ) : (
                            <img
                                src={imgSrc(item.media)}
                                alt={`Imagen de la promoción ${item.title}`}
                                className="banner-carousel-media banner-carousel-img"
                                loading={index === 0 ? 'eager' : 'lazy'}
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
