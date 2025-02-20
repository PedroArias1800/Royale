import { faBookmark, faTag } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParfum } from '../context/ParfumContext'

export const Card = ({element, cardsRef, index, width100, typeOfSale}) => {

    const [width, setWidth] = useState(false);
    const { URLServer } = useParfum();
    const [actualPrice, setActualPrice] = useState(element?.types[0]?.price);
    const [typeOfSales, setTypeOfSales] = useState(typeOfSale=='Normal' ? false : true)

    useEffect(() => {
        if (element?.types[0]?.align == 'auto'){
            setWidth(true)
        }
        if (typeOfSales){
          setActualPrice(element?.types[0]?.price_flash)
        } 
      }, [element, typeOfSales, actualPrice]);

    const gradientStyle = {
        background: "linear-gradient(to bottom, #720c33, var(--color-rojo))",
        WebkitBackgroundClip: "text", // Clipa el fondo al texto
        WebkitTextFillColor: "transparent", // Hace el texto transparente
        fontWeight: "bold", // Opcional: destaca el texto
      };

    return (
        <Link to={`/parfum?id=${element._id}&type=${element?.types[0]?.ml}`} className={`card si ${typeOfSale=='Flash' ? 'demo animated' : ''}`} key={index} style={{'width': `${width100}`, border: typeOfSale=='Flash' ? '10px solid transparent' : 'none'}}>
            <div className='discountPrice infoCardsFlash'>
              <FontAwesomeIcon icon={faBookmark} style={gradientStyle}/>
              {
                (typeOfSales) && (
                  <FontAwesomeIcon icon={faBolt} style={gradientStyle} className='boltFlash' />
                )
              }
              <p>{(Math.ceil(-100+(100/element?.types[0]?.old_price*actualPrice)))}%</p>
              <img src={`${URLServer}${element?.types[0]?.img}`} alt={`Imagen de ${element?.brand.brand_name} ${element?.title}`} />
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
                <div style={{'display': 'flex', 'gap': '5px'}}>
                  <p className="price" style={{'textDecoration': 'line-through', 'margin': 'auto 0'}}>${element?.types[0]?.old_price}</p>
                  <p className="price" style={{'color': 'red', 'margin': 'auto 0'}}>${actualPrice}</p>
                </div>
              </div>
            </div>
            <div className='infoCards'>
              <p>{element?.version?.version_name} {typeOfSale=='Flash' ? '| '+element?.types[0]?.ml+'ml' : ''}</p>
            </div>
            <p className='cardsMarca'>{element?.brand?.brand_name}</p>
        </Link>
      )
}
