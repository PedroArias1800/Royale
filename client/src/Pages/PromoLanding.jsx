import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getParfumVersionRequest, getPromoFeaturedRequest } from '../api/Parfum.api.js';
import { useParfum } from '../context/ParfumContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const WA_NUMBER = '50765623382';

function PromoProduct({ product, onAdd }) {
    const { imgSrc } = useParfum();
    const [selectedType, setSelectedType] = useState(product?.types?.[0]);

    useEffect(() => {
        if (product?.types?.length) setSelectedType(product.types[0]);
    }, [product]);

    if (!product || !selectedType) return null;

    const price = selectedType.price;

    const waText = encodeURIComponent(
        `Hola, quiero comprar: ${product.brand?.brand_name} ${product.title} ${selectedType.ml}ml`
    );
    const waURL = /Mobi|Android/i.test(navigator.userAgent)
        ? `whatsapp://send?phone=${WA_NUMBER}&text=${waText}`
        : `https://wa.me/${WA_NUMBER}?text=${waText}`;

    return (
        <div className="promo-product">
            <div className="promo-product__img-wrap">
                <img
                    src={imgSrc(selectedType?.img)}
                    alt={`${product.brand?.brand_name} ${product.title}`}
                    className="promo-product__img"
                    loading="eager"
                />
            </div>

            <div className="promo-product__info">
                <div className="promo-product__brand-row">
                    <span className="promo-product__line" />
                    <span className="promo-product__brand">{product.brand?.brand_name}</span>
                    <span className="promo-product__line" />
                </div>

                <h1 className="promo-product__title">{product.title}</h1>
                {product.version?.version_name && (
                    <p className="promo-product__version">{product.version.version_name}</p>
                )}

                <div className="promo-product__price-block">
                    <span className="promo-product__price">${Number(price).toFixed(2)}</span>
                </div>

                {product.types.length > 1 && (
                    <div className="promo-product__types">
                        {product.types.map((t) => (
                            <button
                                key={t._id}
                                className={`promo-product__type-btn${selectedType?._id === t._id ? ' active' : ''}`}
                                onClick={() => setSelectedType(t)}
                            >
                                {t.ml} ml
                            </button>
                        ))}
                    </div>
                )}

                {product.description && (
                    <p className="promo-product__desc">{product.description}</p>
                )}

                <div className="promo-product__ctas">
                    <button
                        className="promo-product__cta promo-product__cta--cart"
                        onClick={() => onAdd(product._id, selectedType._id)}
                    >
                        Añadir a la Cesta
                    </button>
                    <a
                        href={waURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="promo-product__cta promo-product__cta--wa"
                    >
                        <FontAwesomeIcon icon={faWhatsapp} /> Consultar por WhatsApp
                    </a>
                </div>

                <div className="promo-product__trust">
                    <span>🔒 Pago seguro</span>
                    <span>📦 Entrega en Panamá</span>
                    <span>✅ 100% Original</span>
                </div>
            </div>
        </div>
    );
}

function FeaturedGrid({ types }) {
    const { imgSrc } = useParfum();
    if (!types.length) {
        return (
            <div className="promo-not-found">
                <p>No hay productos destacados configurados en este momento.</p>
                <Link to="/search">Ver catálogo completo →</Link>
            </div>
        );
    }
    return (
        <div className="promo-grid">
            <h2 className="promo-grid__title">Perfumes Destacados</h2>
            <div className="promo-grid__cards">
                {types.map(t => {
                    const parfum = t.parfum_id_fk;
                    if (!parfum) return null;
                    const brandName = parfum.brand?.brand_name || parfum.brand_id_fk?.brand_name || '';
                    return (
                        <Link
                            key={t._id}
                            to={`/parfum?id=${parfum._id}&type=${t._id}`}
                            className="promo-grid__card card si"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            <div className="discountPrice">
                                <img
                                    src={imgSrc(t.img)}
                                    alt={`${brandName} ${parfum.title}`}
                                    loading="lazy"
                                />
                            </div>
                            <div>
                                <h2>{[brandName, parfum.title].filter(Boolean).join(' ')}</h2>
                                <div className="infoCards">
                                    <span className="promo-grid__tag-dot" />
                                    <p className="price">${Number(t.price).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="infoCards">
                                <p>{t.ml} ml</p>
                            </div>
                            <p className="cardsMarca">{brandName}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export const PromoLanding = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    const [product, setProduct] = useState(null);
    const [featuredTypes, setFeaturedTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const { addToCart } = useParfum();

    useEffect(() => {
        document.title = 'Royale Panama — Oferta Especial';
        return () => { document.title = 'Royale Panama — Perfumes de Lujo en Panamá'; };
    }, []);

    useEffect(() => {
        async function load() {
            try {
                if (id) {
                    const res = await getParfumVersionRequest(id);
                    setProduct(res.data);
                    if (res.data) {
                        const p = res.data;
                        document.title = `${p.brand?.brand_name || ''} ${p.title} · Royale Panama`.trim();
                    }
                } else {
                    const res = await getPromoFeaturedRequest();
                    setFeaturedTypes(res.data || []);
                }
            } catch {
                // fail silently
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleAdd = (productId, typesId) => {
        addToCart(productId, typesId, 1, 10);
        setAdded(true);
        setTimeout(() => setAdded(false), 3000);
    };

    if (loading) {
        return (
            <div className="promo-page promo-page--loading">
                <div className="promo-skeleton">
                    <div className="skeleton promo-skeleton__img" />
                    <div className="promo-skeleton__body">
                        <div className="skeleton promo-skeleton__line promo-skeleton__line--brand" />
                        <div className="skeleton promo-skeleton__line promo-skeleton__line--title" />
                        <div className="skeleton promo-skeleton__line promo-skeleton__line--price" />
                        <div className="skeleton promo-skeleton__cta" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="promo-page">
            <div className="promo-header">
                <div className="promo-header__ornament">
                    <span className="promo-header__line" />
                    <span className="promo-header__gem">◆</span>
                    <span className="promo-header__line" />
                </div>
                <p className="promo-header__label">Oferta Especial · Royale Panama</p>
            </div>

            {added && (
                <div className="promo-added-toast">
                    ✓ Producto añadido al carrito · <Link to="/cart">Ver carrito →</Link>
                </div>
            )}

            {id && product ? (
                <PromoProduct product={product} onAdd={handleAdd} />
            ) : id && !product ? (
                <div className="promo-not-found">
                    <p>Producto no encontrado.</p>
                    <Link to="/search">Ver catálogo completo →</Link>
                </div>
            ) : (
                <FeaturedGrid types={featuredTypes} />
            )}

            <div className="promo-footer-cta">
                <Link to="/search" className="promo-footer-cta__link">
                    Ver catálogo completo →
                </Link>
            </div>
        </div>
    );
};
