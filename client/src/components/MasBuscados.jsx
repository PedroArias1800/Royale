
import { useEffect, useRef, useState } from 'react';
import { Card } from './Card';
import { getParfumsRequest } from '../api/Parfum.api.js';


export const MasBuscados = () => {
  const cardsRef = useRef([]);
  const carouselContainerRef = useRef(null);
  const [parfum, setParfum] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollInterval, setScrollInterval] = useState(10000); // Intervalo inicial de 10 segundos

  useEffect(() => {
    async function loadParfum() {
      const response = await getParfumsRequest(10)
      setParfum(response.data)
    }
    loadParfum()
  }, []);

  useEffect(() => {
      const updateInterval = () => {
          const totalCards = cardsRef.current.length;

          if (currentIndex === 0) {
              setScrollInterval(10000); // Primer elemento: 10 segundos
          } else if (currentIndex >= totalCards - 3) {
              setScrollInterval(2000); // Últimos dos elementos: 3 segundos
          } else {
              setScrollInterval(4000); // Resto: 5 segundos
          }
      };

      updateInterval();

      const interval = setInterval(() => {
          const cardWidth = cardsRef.current[0]?.offsetWidth + 20; // 20px es el margen entre cards
          const totalCards = cardsRef.current.length;

          setCurrentIndex((prevIndex) => {
              const nextIndex = prevIndex + 1;

              if (nextIndex >= totalCards) {
                  // Reiniciar al inicio
                  carouselContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  return 0;
              } else {
                  // Desplazar al siguiente elemento
                  carouselContainerRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
                  return nextIndex;
              }
          });
        }, scrollInterval);

        return () => clearInterval(interval);
    }, [currentIndex, scrollInterval]);

    return (
      <div className='MasBuscados' id="MasBuscados">
        <p className='MasBuscadosTitle'>
          PERFUMES<br/>
          MÁS BUSCADOS
        </p>
        <div className="carousel-container" ref={carouselContainerRef}>
          <div className="carousel">
            {
              parfum.map((element, index) => {
                return (
                  <Card element={element} cardsRef={cardsRef} index={index} key={element.id} width100={'340px'} />
                )
              })
            }
          </div>
        </div>
      </div>
    );
};
