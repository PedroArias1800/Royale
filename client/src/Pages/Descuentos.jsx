import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDiscountsPublicRequest } from '../api/Discounts.api.js';
import '../css/Descuentos.css';

const URLServer = import.meta.env.VITE_SERVER_URL || '';
const imgSrc = (path) => (!path || path.startsWith('http')) ? path : `${URLServer}${path}`;

const PAGE_SIZE = 12;

function DiscountCard({ parfum, discountPct }) {
    const type = parfum.types?.[0];
    if (!type) return null;
    const priceOld = parseFloat(type.price || 0).toFixed(2);
    const priceNew = parseFloat(type.price_discounted ?? (type.price * (1 - discountPct / 100))).toFixed(2);
    const ml = type.ml ? `${type.ml} ml` : null;
    const img = type.img || parfum.img;

    return (
        <Link
            to={`/parfum?id=${parfum._id}&type=${type._id}`}
            className="desc-card"
            onClick={() => window.scrollTo(0, 0)}
        >
            <div className="desc-card__img-wrap">
                {img
                    ? <img src={imgSrc(img)} alt={parfum.title} className="desc-card__img" loading="lazy" />
                    : <div className="desc-card__img-placeholder" />
                }
                <span className="desc-card__discount-overlay">−{discountPct}%</span>
            </div>
            <div className="desc-card__body">
                <p className="desc-card__brand">{parfum.brand?.brand_name || ''}</p>
                <p className="desc-card__title">{parfum.title}</p>
                {ml && <p className="desc-card__ml">{ml}</p>}
                <div className="desc-card__prices">
                    <span className="desc-card__price-old">${priceOld}</span>
                    <span className="desc-card__price-new">${priceNew}</span>
                </div>
            </div>
        </Link>
    );
}

function SkeletonSection() {
    return (
        <div className="desc-section">
            <div className="desc-loading">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="desc-skeleton">
                        <div className="desc-skeleton__img" />
                        <div className="desc-skeleton__body">
                            <div className="desc-skeleton__line desc-skeleton__line--short" />
                            <div className="desc-skeleton__line desc-skeleton__line--tall" />
                            <div className="desc-skeleton__line desc-skeleton__line--short" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DiscountSection({ rule }) {
    const [page, setPage] = useState(1);
    const parfums = rule.parfums || [];
    const total = parfums.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const visible = parfums.slice(start, start + PAGE_SIZE);

    return (
        <section className="desc-section">
            <div className="desc-section__header">
                <h2 className="desc-section__title">{rule.title}</h2>
                <span className="desc-pct-badge">−{rule.discount_pct}%</span>
            </div>
            {rule.description && (
                <p className="desc-section__desc">{rule.description}</p>
            )}
            <div className="desc-section__divider" />

            {total === 0 ? (
                <p style={{ opacity: 0.35, fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Sin parfums disponibles para esta selección.
                </p>
            ) : (
                <>
                    <div className="desc-carousel">
                        {visible.map(parfum => (
                            <DiscountCard
                                key={parfum._id}
                                parfum={parfum}
                                discountPct={rule.discount_pct}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="desc-pagination">
                            <button
                                className="desc-pag-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                ‹
                            </button>
                            <span className="desc-pag-info">
                                {page} / {totalPages}
                                <span className="desc-pag-total"> · {total} parfums</span>
                            </span>
                            <button
                                className="desc-pag-btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                ›
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export const Descuentos = () => {
    const [rules, setRules]     = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDiscountsPublicRequest()
            .then(res => setRules(res.data || []))
            .catch(() => setRules([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="desc-page">
            <header className="desc-hero">
                <div className="desc-hero__ornament">
                    <span className="desc-hero__line" />
                    <span className="desc-hero__gem">◆</span>
                    <span className="desc-hero__line" />
                </div>
                <h1 className="desc-hero__title">Descuentos Exclusivos</h1>
                <p className="desc-hero__sub">Selecciones privilegiadas · Precios especiales</p>
            </header>

            {loading && (
                <>
                    <SkeletonSection />
                    <SkeletonSection />
                </>
            )}

            {!loading && rules.length === 0 && (
                <div className="desc-empty">
                    <div className="desc-empty__icon">✦</div>
                    <p className="desc-empty__msg">No hay descuentos activos en este momento</p>
                    <Link to="/search" className="desc-empty__link" onClick={() => window.scrollTo(0, 0)}>
                        Explorar catálogo
                    </Link>
                </div>
            )}

            {!loading && rules.map(rule => (
                <DiscountSection key={rule._id} rule={rule} />
            ))}
        </div>
    );
};
