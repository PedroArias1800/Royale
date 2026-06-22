import { faBookmark, faShare } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useContext } from 'react';
import { ParfumContext } from "../context/ParfumContext";
import { Alert } from '../components/Alert'
import { Link } from 'react-router-dom';
import { useParfum } from '../context/ParfumContext'

export const ParfumInfo = ({ product, typeParfum }) => {
  const [selectedType, setSelectedType] = useState();
  const [alertMessage, setAlertMessage] = useState("");
  const { imgSrc, URLFrontend, URLServer } = useParfum();
  const [actualPrice, setActualPrice] = useState(product?.types[0]?.price);
  const [validFlash, setValidFlash] = useState(false)

  const { addToCart } = useContext(ParfumContext);

  const handleAddToCart = (productId, typesId, maxQuantity) => {
    if (validFlash){
      addToCart(productId, typesId, 1, maxQuantity);
    } else {
      addToCart(productId, typesId, 1, 10);
    }
    setAlertMessage("¡Producto añadido al carrito!");
  };

  useEffect(() => {
    if (product && product?.types && product?.types?.length > 0) {
      setSelectedType(
        product?.types.find((type) => type?.ml === typeParfum) || product?.types[0]
      );
      setActualPrice(product?.types[0]?.price_flash)
    }
  }, [product]);

  useEffect(() => {
    setActualPrice(selectedType?.price_flash || selectedType?.price)
    setValidFlash(selectedType?.type_of_sale == 'Flash' && selectedType.quantity_flash > 0)
  }, [selectedType]);

  const gradientStyle = {
    background: "linear-gradient(to bottom, #ff006a,rgb(184, 14, 85))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const handleTypeSelection = (type) => setSelectedType(type);

  if (!product || !selectedType) {
    return <p>Cargando...</p>;
  }

  const handleShare = async () => {
    const shareUrl = `${URLServer}/share/parfum?id=${product._id}`;
    const shareData = {
      title: `${product?.brand?.brand_name} ${product.title} ${product?.version?.version_name} ${selectedType.ml}ml`,
      text: `Mira este impresionante ${product?.brand?.brand_name} ${product.title} en Royale Panama`,
      url: shareUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('¡Enlace copiado al portapapeles!');
      } catch {
        alert(`Copia y comparte:\n${shareUrl}`);
      }
    }
  };

  return (
    <div className="parfumInfo">
      <Alert message={alertMessage} color={'--color-dorado'} color2={'--color-dorado-hover'} onClose={() => setAlertMessage("")}/>

      <div className="parfumContainer">

        {/* ── Imagen ── */}
        <div className="parfumImgGrande">
          <div className={`discountPrice ${validFlash ? 'demo animated' : ''}`} style={{border: validFlash ? '10px solid transparent' : 'none', borderRadius: validFlash ? '10px' : ''}}>
            {validFlash && (
              <FontAwesomeIcon icon={faBolt} style={gradientStyle} className='boltFlash' />
            )}
            <img
              src={imgSrc(selectedType?.img)}
              alt={`${product?.brand?.brand_name} ${product?.title} ${product?.version?.version_name} - ${selectedType.ml}ml`}
            />
            {validFlash && (
              <p className='quantityFlash'>{selectedType?.quantity_flash} Disponibles</p>
            )}
          </div>
          <p className="parfumDescription esconder">{product.description}</p>
        </div>

        {/* ── Info ── */}
        <div className="parfumInfoGrande">

          {/* Ornamental line above brand */}
          <div className="pi-brand-row">
            <span className="pi-brand-line" />
            <span className="pi-brand-name">{product?.brand?.brand_name}</span>
            <span className="pi-brand-line" />
          </div>

          <h3>
            {product.title}{' '}
            <span className="pi-version">{product?.version?.version_name}</span>
          </h3>

          {/* Price block */}
          <div className="pi-price-block">
            <span className="pi-price-current">${actualPrice}</span>
            <Link to={`/search?type=${product.gender}`} className="parfumGenero pi-gender">
              {product.gender === 1 ? 'Damas' : 'Caballeros'}
            </Link>
          </div>

          <div className="pi-separator">
            <span className="pi-sep-line" />
            <span className="pi-sep-gem">◆</span>
            <span className="pi-sep-line" />
          </div>

          {/* Size + share */}
          <div className='mlShareParfum'>
            <h5>
              {selectedType.ml}ml
              {validFlash && ` · Solo ${selectedType?.quantity_flash} disponibles`}
            </h5>
            <FontAwesomeIcon icon={faShare} style={gradientStyle} onClick={handleShare} title="Compartir" />
          </div>

          {/* Size thumbnails */}
          <div className="vistaPrevia">
            {product?.types.map((type, index) => (
              <div
                key={index}
                className={`vistaPreviaVersion ${selectedType === type ? 'selected' : ''}`}
                onClick={() => handleTypeSelection(type)}
              >
                <img
                  src={imgSrc(type.img)}
                  alt={`${type.ml} ml`}
                  className={`${selectedType === type && validFlash ? 'demo animated' : ''}`}
                  style={{border: selectedType === type && validFlash ? '4px solid transparent' : ''}}
                />
                <p>{type.ml} ml</p>
              </div>
            ))}
          </div>

          <p className="parfumDescription esconder2">{product?.description}</p>

          {/* Add to cart */}
          <div className="enviarCesta">
            <button onClick={() => handleAddToCart(product?._id, selectedType?._id, selectedType?.quantity_flash)}>
              {validFlash ? '⚡ Añadir — Oferta Flash' : 'Añadir a la Cesta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
