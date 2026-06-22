import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const DIMS = [
    { key: 'payment', label: 'Método de Pago' },
    { key: 'delivery', label: 'Método de Entrega' },
    { key: 'channel', label: 'Canal de Acceso' },
    { key: 'seller', label: 'Vendedor' },
];

const COLORS = ['#fdd05e', '#d60a5f', '#2ecc71', '#a78bfa', '#38bdf8'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p>{label}</p>
            <p style={{ color: '#fdd05e' }}>${Number(payload[0].value).toFixed(2)}</p>
            <p style={{ color: 'rgba(237,232,235,0.5)' }}>{payload[0].payload.count} transacciones</p>
        </div>
    );
};

export const ChartMetodos = ({ fetchBreakdown, loading }) => {
    const [dim, setDim] = useState('payment');
    const [data, setData] = useState([]);
    const [innerLoading, setInnerLoading] = useState(false);

    const loadDim = async (key) => {
        setDim(key);
        setInnerLoading(true);
        const result = await fetchBreakdown(key);
        setData(result || []);
        setInnerLoading(false);
    };

    // Load on first render via useEffect-like pattern (called from parent via prop change)
    // Parent triggers initial load by calling fetchBreakdown on period change
    const handleDimChange = (key) => {
        loadDim(key);
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3 className="chart-title">Análisis por Dimensión</h3>
                <div className="dim-tabs">
                    {DIMS.map((d) => (
                        <button
                            key={d.key}
                            className={`dim-tab${dim === d.key ? ' active' : ''}`}
                            onClick={() => handleDimChange(d.key)}
                            type="button"
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>
            {(loading || innerLoading) ? (
                <div className="chart-placeholder">Cargando...</div>
            ) : !data.length ? (
                <div className="chart-placeholder">Sin datos — edita transacciones para agregar información</div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
