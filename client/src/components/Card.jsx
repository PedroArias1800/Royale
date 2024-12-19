import { faBookmark, faTag } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export const Card = ({element, cardsRef, index}) => {

    const [width, setWidth] = useState(false);

    useEffect(() => {
        if (element.types[0].align == 'auto'){
            setWidth(true)
        }
      }, [element]);

    const gradientStyle = {
        background: "linear-gradient(to bottom, #720c33, var(--color-rojo))",
        WebkitBackgroundClip: "text", // Clipa el fondo al texto
        WebkitTextFillColor: "transparent", // Hace el texto transparente
        fontWeight: "bold", // Opcional: destaca el texto
      };

    return (
        <Link to={`/parfum?id=${element.id}`} className={`card ${width ? 'cardWidth100' : ''} `} key={index} ref={(el) => (cardsRef.current[index] = el)}>
            <div className='discountPrice'>
              <FontAwesomeIcon icon={faBookmark} style={gradientStyle}/>
              <p>{(Math.ceil(-100+(100/element.types[0].old_price*element.types[0].price)))}%</p>
              <img src={`/parfum/${element.types[0].img}`} alt={`Imagen de ${element.brand} ${element.title}`} />
            </div>
            <div>
              <h2>{element.brand} {element.title}</h2>
              <div className='infoCards'>
                <FontAwesomeIcon icon={faTag} style={{'background': '#d60a5f', 'color': 'white', 'borderRadius': '50%', 'padding': '2%'}}/>
                <div style={{'display': 'flex', 'gap': '5px'}}>
                  <p className="price" style={{'textDecoration': 'line-through', 'margin': 'auto 0'}}>${element.types[0].old_price}</p>
                  <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${element.types[0].price}</p>
                </div>
              </div>
            </div>
            <div className='infoCards'>
              <p>{element.types[0].version_name} Version {element.types[0].ml} ml.</p>
            </div>
            <p className='cardsMarca'>{element.brand}</p>
        </Link>
      )
}
