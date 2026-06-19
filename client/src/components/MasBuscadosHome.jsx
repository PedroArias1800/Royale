import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Card } from './Card';

export const MasBuscadosHome = ({ title, typeOfSale, parfum }) => {
  const cardsRef = useRef([]);
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const displayParfums = parfum.slice(0, 11);
  const hasMore = parfum.length > 11;
  const totalItems = displayParfums.length + (hasMore ? 1 : 0);

  const scrollToCenter = (card, track) => {
    const scrollLeft = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(index, totalItems - 1));
    setCurrentIndex(clamped);
    const card = cardsRef.current[clamped];
    if (card && trackRef.current) {
      scrollToCenter(card, trackRef.current);
    }
  };

  useEffect(() => {
    if (isPaused || isHovered || totalItems === 0) return;
    const id = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1 >= totalItems ? 0 : prev + 1;
        const card = cardsRef.current[next];
        if (card && trackRef.current) {
          scrollToCenter(card, trackRef.current);
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [isHovered, isPaused, totalItems]);

  if (!parfum || parfum.length === 0) return null;

  return (
    <section
      className={`mbh ${typeOfSale === 'Flash' ? 'mbh--flash' : ''}`}
      id={typeOfSale === 'Flash' ? 'VentasFlash' : 'MasBuscados'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mbh__header">
        <div className="mbh__ornament-line" />
        <h2 className="mbh__title">{title}</h2>
        <div className="mbh__ornament-line" />
      </div>

      <div className="mbh-carousel">
        <div className="mbh-carousel__track" ref={trackRef}>
          {displayParfums.map((element, index) => (
            <div
              key={element._id}
              className={`mbh-carousel__item ${index === currentIndex ? 'mbh-carousel__item--active' : ''}`}
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <Card
                element={element}
                cardsRef={{ current: [] }}
                index={index}
                width100="100%"
                typeOfSale={typeOfSale}
              />
            </div>
          ))}

          {hasMore && (
            <div
              className={`mbh-carousel__item mbh-carousel__item--seemore ${displayParfums.length === currentIndex ? 'mbh-carousel__item--active' : ''}`}
              ref={(el) => (cardsRef.current[displayParfums.length] = el)}
            >
              <Link to="/search" className="mbh-seemore-card">
                <div className="mbh-seemore-card__inner">
                  <span className="mbh-seemore-card__label">Colección completa</span>
                  <span className="mbh-seemore-card__title">Ver más<br />perfumes</span>
                  <span className="mbh-seemore-card__ornament">◆</span>
                  <span className="mbh-seemore-card__cta">
                    Explorar ahora <FontAwesomeIcon icon={faArrowRight} />
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <button
          className="mbh-carousel__arrow mbh-carousel__arrow--prev"
          onClick={() => { setIsPaused(true); goTo(currentIndex - 1); setTimeout(() => setIsPaused(false), 4000); }}
          aria-label="Anterior"
          disabled={currentIndex === 0}
        >‹</button>
        <button
          className="mbh-carousel__arrow mbh-carousel__arrow--next"
          onClick={() => { setIsPaused(true); goTo(currentIndex + 1); setTimeout(() => setIsPaused(false), 4000); }}
          aria-label="Siguiente"
          disabled={currentIndex >= totalItems - 1}
        >›</button>
      </div>

      <div className="mbh-carousel__dots">
        {Array.from({ length: totalItems }).map((_, i) => (
          <button
            key={i}
            className={`mbh-carousel__dot ${i === currentIndex ? 'mbh-carousel__dot--active' : ''}`}
            onClick={() => { setIsPaused(true); goTo(i); setTimeout(() => setIsPaused(false), 4000); }}
            aria-label={`Ir al elemento ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
