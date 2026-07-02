import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#fdd05e', '#f5c430', '#d60a5f', '#a78bfa', '#38bdf8', '#2ecc71', '#fb923c', '#e879f9', '#34d399', '#f87171'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p style={{ color: '#fdd05e', fontWeight: 600 }}>{d.name}</p>
            <p style={{ color: '#2ecc71' }}>{d.units} unidades vendidas</p>
            <p style={{ color: 'rgba(237,232,235,0.5)' }}>{d.orders} orden{d.orders !== 1 ? 'es' : ''}</p>
        </div>
    );
};

export const ChartTopParfums = ({ fetchTopProducts, loading }) => {
    const [data, setData] = useState([]);
    const [innerLoading, setInnerLoading] = useState(false);

    useEffect(() => {
        setInnerLoading(true);
        fetchTopProducts().then(r => setData(r || [])).finally(() => setInnerLoading(false));
    }, [fetchTopProducts]);

    const isLoading = loading || innerLoading;

    // Truncar nombres largos para el eje Y
    const truncate = (name, max = 26) =>
        name && name.length > max ? name.slice(0, max - 1) + '…' : name;

    const chartData = data.map(d => ({ ...d, shortName: truncate(d.name) }));

    return (
        <div className="chart-card chart-top-parfums">
            <div className="chart-header">
                <h3 className="chart-title">Parfums Más Vendidos</h3>
                <span className="chart-subtitle">unidades por período</span>
            </div>

            {isLoading ? (
                <div className="chart-placeholder">Cargando...</div>
            ) : !chartData.length ? (
                <div className="chart-placeholder">Sin ventas en el período seleccionado</div>
            ) : (
                <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 38)}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }}
                            tickFormatter={(v) => `${v} ud.`}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="shortName"
                            width={170}
                            tick={{ fill: 'rgba(237,232,235,0.75)', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="units" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'rgba(237,232,235,0.45)', fontSize: 11 }}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
