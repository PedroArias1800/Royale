
import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from './Card';

const PAUSE_DURATION = 12000; // ms de pausa tras swipe del usuario
const SNAP_DEBOUNCE  = 220;   // ms tras el último scroll para centrar la tarjeta
const MIN_SWIPE_PX   = 8;     // px horizontales mínimos para contar como swipe real

export const MasBuscados = ({ title, typeOfSale, parfum }) => {
  const cardsRef             = useRef([]);
  const carouselContainerRef = useRef(null);
  const activeIndexRef       = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const pauseUntilRef       = useRef(0);     // timestamp hasta el que el auto-avance está pausado
  const snapTimeoutRef      = useRef(null);
  const userScrollActiveRef = useRef(false); // solo true cuando el usuario está haciendo swipe real
  const touchStartX         = useRef(0);

  const getDelay = (idx, total) => {
    if (idx === 0)         return 10000;
    if (idx >= total - 3) return 2000;
    return 4000;
  };

  // Scroll absoluto a una tarjeta específica (sin flag — el auto-avance no activa userScrollActiveRef)
  const scrollToCard = useCallback((index, behavior = 'smooth') => {
    const container = carouselContainerRef.current;
    const card      = cardsRef.current[index];
    if (!container || !card) return;
    const left = card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior });
  }, []);

  // Centra la tarjeta más próxima al centro del viewport
  const snapToNearest = useCallback(() => {
    const container = carouselContainerRef.current;
    if (!container) return;

    const viewCenter = container.scrollLeft + container.offsetWidth / 2;
    let best = 0;
    let minDist = Infinity;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - viewCenter);
      if (dist < minDist) { minDist = dist; best = i; }
    });

    scrollToCard(best);
    activeIndexRef.current = best;
    setActiveIndex(best);
  }, [scrollToCard]);

  // Listeners de interacción
  useEffect(() => {
    const container = carouselContainerRef.current;
    if (!container) return;

    // Solo registra posición inicial; no pausa todavía
    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };

    // Activa el flag solo si hay movimiento horizontal real (swipe, no tap)
    const onTouchMove = (e) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      if (dx > MIN_SWIPE_PX) {
        userScrollActiveRef.current = true;
        pauseUntilRef.current = Date.now() + PAUSE_DURATION;
      }
    };

    // Desktop: rueda del ratón
    const onWheel = () => {
      userScrollActiveRef.current = true;
      pauseUntilRef.current = Date.now() + PAUSE_DURATION;
    };

    // Scroll: solo actúa si el usuario inició el scroll (no el auto-avance)
    const onScroll = () => {
      if (!userScrollActiveRef.current) return;
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = setTimeout(() => {
        userScrollActiveRef.current = false; // listo, snap hecho
        snapToNearest();
      }, SNAP_DEBOUNCE);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove',  onTouchMove,  { passive: true });
    container.addEventListener('wheel',      onWheel,      { passive: true });
    container.addEventListener('scroll',     onScroll,     { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove',  onTouchMove);
      container.removeEventListener('wheel',      onWheel);
      container.removeEventListener('scroll',     onScroll);
      clearTimeout(snapTimeoutRef.current);
    };
  }, [snapToNearest]);

  // Aplica clase activa directo en el DOM (evita re-render de todos los Card)
  useEffect(() => {
    cardsRef.current.forEach((card, i) => {
      card?.classList.toggle('carousel-active', i === activeIndex);
    });
  }, [activeIndex]);

  // Auto-avance
  useEffect(() => {
    const total = parfum.length;
    const delay = getDelay(activeIndex, total);

    const timer = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return; // pausado por interacción del usuario

      const next = activeIndexRef.current + 1;

      if (next >= parfum.length) {
        scrollToCard(0);
        activeIndexRef.current = 0;
        setActiveIndex(0);
      } else {
        scrollToCard(next);
        activeIndexRef.current = next;
        setActiveIndex(next);
      }
    }, delay);

    return () => clearInterval(timer);
  }, [activeIndex, parfum.length, scrollToCard]);

  return (
    <>
      {parfum.length > 0 && (
        <div
          className={`MasBuscados ${typeOfSale === 'Flash' ? 'MasBuscadosVentasFlash' : ''}`}
          id={typeOfSale === 'Flash' ? 'VentasFlash' : 'MasBuscados'}
        >
          <p className='MasBuscadosTitle'>{title}</p>
          <div className="carousel-container" ref={carouselContainerRef}>
            <div className="carousel">
              {parfum.map((element, index) => (
                <Card
                  element={element}
                  cardsRef={cardsRef}
                  index={index}
                  key={element._id}
                  width100={'340px'}
                  typeOfSale={typeOfSale}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
