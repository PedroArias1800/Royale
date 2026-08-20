import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LinkWay } from '../components/LinkWay';
import { ParfumInfo } from '../components/ParfumInfo';
import { getParfumVersionRequest } from '../api/Parfum.api.js';
import { useParfum } from '../context/ParfumContext';
import '../css/Search.css';

export const ParfumDetails = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id   = params.get('id');
    const type = params.get('type') || '100';

    const [product, setProduct] = useState();
    const { getDiscount } = useParfum();

    useEffect(() => {
        if (!id) return;
        getParfumVersionRequest(id)
            .then(res => {
                setProduct(res.data);
                const p = res.data;
                if (p) {
                    const brand = p.brand?.brand_name || '';
                    document.title = `${brand} ${p.title} · Royale Panama`.trim();
                }
            })
            .catch(err => console.error('Error al cargar el perfume:', err));
        window.scrollTo(0, 0);
        return () => { document.title = 'Royale Panama — Perfumes de Lujo en Panamá'; };
    }, [id]);

    const discountPct = getDiscount && product ? getDiscount(product) : null;

    return (
        <>
            <LinkWay product={product} id={id} />
            <ParfumInfo
                product={product}
                typeParfum={type}
                discountPct={discountPct}
            />
        </>
    );
};
