import { faTag } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParfum } from '../context/ParfumContext'

export const Card = ({element, cardsRef, index, width100, typeOfSale}) => {

    const [width, setWidth] = useState(false);
    const { imgSrc } = useParfum();
    const [typeOfSales, setTypeOfSales] = useState(typeOfSale=='Normal' ? false : true)
    let actualPrice = typeOfSales ? element?.types[0]?.price_flash : element?.types[0]?.price;

    useEffect(() => {
      if (element?.types[0]?.align == 'auto'){
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
        <Link to={`/parfum?id=${element._id}&type=${element?.types[0]?.ml}`} className={`card si ${typeOfSale=='Flash' ? 'demo animated' : ''}`} key={index} ref={(el) => (cardsRef.current[index] = el)} style={{'width': `${width100}`, ...(typeOfSale=='Flash' ? { border: '10px solid transparent' } : {})}}>
            <div className='discountPrice infoCardsFlash'>
              {
                (typeOfSales) && (
                  <FontAwesomeIcon icon={faBolt} style={gradientStyle} className='boltFlash' />
                )
              }
              <img src={imgSrc(element?.types[0]?.img)} alt={`Imagen de ${element?.brand.brand_name} ${element?.title}`} />
              {
                (typeOfSales) && (
                  <p className='quantityFlash'>{element?.types[0]?.quantity_flash} Disponibles</p>
                )
              }
            </div>
            <div>
              <h2>{element?.brand?.brand_name} {element?.title}</h2>
              <div className='infoCards'>
                <FontAwesomeIcon icon={faTag} style={{'background': '#d60a5f', 'color': 'white', 'borderRadius': '50%', 'padding': '2%'}}/>
                <p className="price">${actualPrice}</p>
              </div>
            </div>
            <div className='infoCards'>
              <p>{element?.version?.version_name} {typeOfSale=='Flash' ? '| '+element?.types[0]?.ml+'ml' : ''}</p>
            </div>
            <p className='cardsMarca'>{element?.brand?.brand_name}</p>
        </Link>
      )
}
