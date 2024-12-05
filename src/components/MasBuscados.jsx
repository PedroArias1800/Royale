
import { useEffect, useRef, useState } from 'react';
import data from '../json/Parfum.json'
import { Link } from 'react-router-dom';

export const MasBuscados = () => {
  const carouselContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsRef = useRef([]);
  const [scrollInterval, setScrollInterval] = useState(10000); // Intervalo inicial de 10 segundos

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
              data.Parfum.map((element, index) => (
              <Link to={`/parfum/${index}`} className="card" key={index} ref={(el) => (cardsRef.current[index] = el)}>
                  <img src={`/parfum/${element.img}`} alt={`Imagen de ${element.marca} ${element.title}`} />
                  <div>
                    <h2>{element.marca} {element.title}</h2>
                    <p className="price">USD {element.price}</p>
                  </div>
                  <p className="description">{element.description}</p>
              </Link>
              ))
            }
          </div>
        </div>
      </div>
    );
};
