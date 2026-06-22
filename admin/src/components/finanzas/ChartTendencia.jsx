import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="ct-label">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: ${Number(p.value).toFixed(2)}
                </p>
            ))}
        </div>
    );
};

export const ChartTendencia = ({ data, loading }) => {
    if (loading) return <div className="chart-placeholder">Cargando...</div>;
    if (!data?.length) return <div className="chart-placeholder">Sin datos para el período seleccionado</div>;

    return (
        <div className="chart-card">
            <h3 className="chart-title">Tendencia de Ingresos vs Salidas</h3>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="period" tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'rgba(237,232,235,0.7)', fontSize: 12 }} />
                    <Line
                        type="monotone"
                        dataKey="ingresos"
                        name="Ingresos"
                        stroke="#2ecc71"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#2ecc71' }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="salidas"
                        name="Salidas"
                        stroke="#d60a5f"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#d60a5f' }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
