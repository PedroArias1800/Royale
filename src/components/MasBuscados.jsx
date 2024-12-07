
import { useEffect, useRef, useState } from 'react';
import data from '../json/Parfum.json'
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faTag } from '@fortawesome/free-solid-svg-icons';

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

    const gradientStyle = {
      background: "linear-gradient(to bottom, #720c33, var(--color-rojo))",
      WebkitBackgroundClip: "text", // Clipa el fondo al texto
      WebkitTextFillColor: "transparent", // Hace el texto transparente
      fontWeight: "bold", // Opcional: destaca el texto
    };

    return (
      <div className='MasBuscados' id="MasBuscados">
        <p className='MasBuscadosTitle'>
          PERFUMES<br/>
          MÁS BUSCADOS
        </p>
        <div className="carousel-container" ref={carouselContainerRef}>
          <div className="carousel">
            {
              data.Parfum.map((element, index) => {
                const selectedType = element.types.find((type) => type.ml === "100") || element.types[0];

                
              return (
                <Link to={`/parfum/${index}`} className="card" key={index} ref={(el) => (cardsRef.current[index] = el)}>
                    <div className='discountPrice'>
                      <FontAwesomeIcon icon={faBookmark} style={gradientStyle}/>
                      <p>{(Math.ceil(-100+(100/selectedType.oldPrice*selectedType.price)))}%</p>
                      <img src={`/parfum/${selectedType.img}`} alt={`Imagen de ${element.marca} ${element.title}`} />
                    </div>
                    <div>
                      <h2>{element.marca} {element.title}</h2>
                      <div className='infoCards'>
                        <FontAwesomeIcon icon={faTag} style={{'background': '#d60a5f', 'color': 'white', 'borderRadius': '50%', 'padding': '2%'}}/>
                        <div style={{'display': 'flex', 'gap': '5px'}}>
                          <p className="price" style={{'textDecoration': 'line-through', 'margin': 'auto 0'}}>${selectedType.oldPrice}</p>
                          <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${selectedType.price}</p>
                        </div>
                      </div>
                    </div>
                    <div className='infoCards'>
                      <p>{selectedType.version} Version {selectedType.ml} ml.</p>
                    </div>
                    <p className='cardsMarca'>{element.marca}</p>
                </Link>
              )
              })
            }
          </div>
        </div>
      </div>
    );
};
