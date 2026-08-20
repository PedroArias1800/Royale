import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTypesRequest, getPromoFeaturedRequest, putPromoFeaturedRequest } from '../api/PromoFeatured.api.js';
import { useAuth } from '../context/AuthProvider';

const URLServer = import.meta.env.VITE_SERVER_URL || '';
const imgSrc = (path) => (!path || path.startsWith('http')) ? path : `${URLServer}${path}`;

export const PromoConfig = () => {
    const { showAlert } = useAuth();
    const [allTypes, setAllTypes] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [allRes, featuredRes] = await Promise.all([
                    getAllTypesRequest(),
                    getPromoFeaturedRequest(),
                ]);
                setAllTypes(allRes.data || []);
                const featuredIds = new Set((featuredRes.data || []).map(t => t._id));
                setSelectedIds(featuredIds);
            } catch {
                showAlert('Error al cargar los tipos de perfume.', 0);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const toggle = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await putPromoFeaturedRequest([...selectedIds]);
            showAlert(`${selectedIds.size} tipo(s) configurados como destacados en Promo.`, 1);
        } catch {
            showAlert('Error al guardar. Intenta de nuevo.', 0);
        } finally {
            setSaving(false);
        }
    };

    const filtered = allTypes
        .filter(t => {
            const q = search.toLowerCase();
            const parfumTitle = t.parfum_id_fk?.title || '';
            return parfumTitle.toLowerCase().includes(q) || (t.ml || '').toLowerCase().includes(q);
        })
        .sort((a, b) => {
            const aSelected = selectedIds.has(a._id) ? 0 : 1;
            const bSelected = selectedIds.has(b._id) ? 0 : 1;
            return aSelected - bSelected;
        });

    if (loading) return <div className="promo-config__loading">Cargando tipos de perfume…</div>;

    return (
        <div className="promo-config">
            <div className="volverAnadir" style={{ marginBottom: '1rem' }}>
                <Link to="/admin" className="btn-volver">← Volver</Link>
            </div>
            <div className="promo-config__header">
                <div>
                    <h1 className="promo-config__title">Perfumes Destacados en Promo</h1>
                    <p className="promo-config__sub">
                        Los tipos seleccionados aparecerán en la página <code>/promo</code> cuando no se especifica un producto.
                    </p>
                </div>
                <button
                    className="promo-config__save"
                    onClick={save}
                    disabled={saving}
                >
                    {saving ? 'Guardando…' : `Guardar (${selectedIds.size} seleccionados)`}
                </button>
            </div>

            <input
                type="text"
                className="promo-config__search"
                placeholder="Buscar por nombre de perfume o tamaño…"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="promo-config__grid">
                {filtered.map(t => {
                    const checked = selectedIds.has(t._id);
                    const parfumTitle = t.parfum_id_fk?.title || '—';
                    return (
                        <div
                            key={t._id}
                            className={`promo-config__card${checked ? ' promo-config__card--selected' : ''}`}
                            onClick={() => toggle(t._id)}
                        >
                            <div className="promo-config__check">{checked ? '✓' : ''}</div>
                            {t.img && (
                                <img
                                    src={imgSrc(t.img)}
                                    alt={parfumTitle}
                                    className="promo-config__img"
                                />
                            )}
                            <p className="promo-config__name">{parfumTitle}</p>
                            <p className="promo-config__ml">{t.ml} ml · ${Number(t.price).toFixed(2)}</p>
                            <p className="promo-config__id">{t._id}</p>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <p className="promo-config__empty">No hay resultados para "{search}"</p>
                )}
            </div>
        </div>
    );
};
