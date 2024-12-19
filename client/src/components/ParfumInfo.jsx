import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useContext } from 'react';
import { ParfumContext } from "../context/ParfumContext";
import { Alert } from '../components/Alert'

export const ParfumInfo = ({ product }) => {
  const [cart, setCart] = useState([]);
  const [selectedType, setSelectedType] = useState();
  const [alertMessage, setAlertMessage] = useState("");

  const { addToCart } = useContext(ParfumContext);

  const handleAddToCart = (productId, typesId) => {
    addToCart(productId, typesId, 1);
    setAlertMessage("Añadido al carrito");
  };

  useEffect(() => {
    if (product && product.types && product.types.length > 0) {
      setSelectedType(
        product.types.find((type) => type.ml === "100") || product.types[0]
      );
    }
  }, [product]);

  const gradientStyle = {
    background: "linear-gradient(to bottom, #720c33, var(--color-rojo))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold",
  };

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

  if (!product || !selectedType) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="parfumInfo">
      <div className='mostrarAlerta'>
        <Alert message={alertMessage} onClose={() => setAlertMessage("")} class/>
      </div>
      <div className="parfumContainer">
        <div className="parfumImgGrande">
          <div className="discountPrice">
            <FontAwesomeIcon icon={faBookmark} style={gradientStyle} />
            <p>
              {Math.ceil(
                -100 + (100 / selectedType.old_price) * selectedType.price
              )}
              %
            </p>
            <img
              src={`/parfum/${selectedType.img}`}
              alt={`Imágen de ${product.brand} ${product.title} versión ${selectedType.version}`}
            />
          </div>
          <p className="parfumDescription esconder">{product.description}</p>
        </div>
        <div className="parfumInfoGrande">
          <h3>
            {product.brand} {product.title}
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
            <p className="parfumGenero">
              {product.gender === 1 ? "Damas" : "Caballeros"}
            </p>
          </div>
          <hr />
          <div>
            <h5>
              Versión: {selectedType.version_name} - {selectedType.ml} ml.
            </h5>
            <div className="vistaPrevia">
              {product.types.map((type, index) => (
                <div
                  key={index}
                  className={`vistaPreviaVersion ${
                    selectedType === type ? "selected" : ""
                  }`}
                  onClick={() => handleTypeSelection(type)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={`/parfum/${type.img}`}
                    alt={`Imágen de la versión ${type.version_name}`}
                  />
                  <p>{type.version_name}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="parfumDescription esconder2">{product.description}</p>
          <div className="enviarCesta">
            <button onClick={() => handleAddToCart(product.id, selectedType.types_id)}>Añadir a la Cesta</button>
          </div>
        </div>
      </div>
    </div>
  );
};
