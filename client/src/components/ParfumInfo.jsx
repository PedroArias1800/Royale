import { faBookmark, faShare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useContext } from 'react';
import { ParfumContext } from "../context/ParfumContext";
import { Alert } from '../components/Alert'
import { Link } from 'react-router-dom';
const URLServer = import.meta.env.VITE_SERVER_URL || 'http://93.188.162.15:4001'
const URLFrontend = import.meta.env.VITE_FRONTEND_URL || 'http://93.188.162.15:5173'

export const ParfumInfo = ({ product }) => {
  const [selectedType, setSelectedType] = useState();
  const [alertMessage, setAlertMessage] = useState("");

  const { addToCart } = useContext(ParfumContext);

  const handleAddToCart = (productId, typesId) => {
    addToCart(productId, typesId, 1);
    setAlertMessage("¡Producto añadido al carrito!");
  };

  useEffect(() => {
    if (product && product?.types && product?.types?.length > 0) {
      setSelectedType(
        product?.types.find((type) => type?.ml === "100") || product?.types[0]
      );
    }
  }, [product]);

  const gradientStyle = {
    background: "linear-gradient(to bottom, #ff006a,rgb(184, 14, 85))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

  if (!product || !selectedType) {
    return <p>Cargando...</p>;
  }

  const handleShare = async () => {
    const shareData = {
      title: `${product?.brand?.brand_name} ${product.title} ${product?.version?.version_name} ${selectedType.ml}ml`,
      text: `Mira este impresionante ${product?.brand?.brand_name} ${product.title} perfume!`,
      url: `${URLFrontend}/parfum?id=${product._id}`,
    };
  
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert(
        `Copia y comparte: ${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
      );
    }
  };
  
  

  return (
    <div className="parfumInfo">
      <div className='mostrarAlerta'>
        <Alert message={alertMessage} color={'--color-dorado'} color2={'--color-dorado-hover'} onClose={() => setAlertMessage("")}/>
      </div>
      <div className="parfumContainer">
        <div className="parfumImgGrande">
          <div className="discountPrice">
            <FontAwesomeIcon icon={faBookmark} style={gradientStyle} />
            <p>
              {Math.ceil(
                -100 + (100 / selectedType?.old_price) * selectedType?.price
              )}
              %
            </p>
            <img
              src={`${URLServer}${selectedType?.img}`}
              alt={`Imágen de ${product?.brand?.brand_name} ${product?.title} versión ${product?.version?.version_name} - ${selectedType.ml} mililitros.`}
            />
          </div>
          <p className="parfumDescription esconder">{product.description}</p>
        </div>
        <div className="parfumInfoGrande">
          <h3>
            {product?.brand?.brand_name} {product.title} {product?.version?.version_name}
          </h3>
          <div className='precioGenero'>
            <div style={{ display: "flex", gap: "5px" }}>
              <p
                className="price"
                style={{ textDecoration: "line-through", margin: "auto 0" }}
              >
                ${selectedType.old_price}
              </p>
              <p className="price" style={{ color: "red", margin: "auto 0" }}>
                ${selectedType.price}
              </p>
            </div>
            <p>
              <Link to={`/search?type=${product.gender}`} className="parfumGenero">
                {product.gender === 1 ? "Damas" : "Caballeros"}
              </Link>
            </p>
          </div>
          <hr />
          <div>
            <div className='mlShareParfum'>
              <h5>{selectedType.ml}ml</h5>
              <FontAwesomeIcon icon={faShare} style={gradientStyle} onClick={handleShare}/>
            </div>
            <div className="vistaPrevia">
              {product?.types.map((type, index) => (
                <div
                  key={index}
                  className={`vistaPreviaVersion ${
                    selectedType === type ? "selected" : ""
                  }`}
                  onClick={() => handleTypeSelection(type)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={`${URLServer}${type.img}`}
                    alt={`Imágen de ${type.ml} ml`}
                  />
                  <p>{type.ml} ml</p>
                </div>
              ))}
            </div>
          </div>
          <p className="parfumDescription esconder2">{product?.description}</p>
          <div className="enviarCesta">
            <button onClick={() => handleAddToCart(product?._id, selectedType?._id)}>Añadir a la Cesta</button>
          </div>
        </div>
      </div>
    </div>
  );
};
