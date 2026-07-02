import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/**
 * Detecta y formatea la etiqueta del período para el eje X.
 *   "2026-07-02" → "02 Jul"        (día)
 *   "2026-27"    → "Sem 27"        (semana ISO — num > 12)
 *   "2026-07"    → "Jul"           (mes — num ≤ 12)
 */
function formatPeriodLabel(p) {
    if (!p) return p;
    if (p.length === 10) {
        // Día: "YYYY-MM-DD"
        const [, m, d] = p.split('-');
        return `${d} ${MESES_CORTO[parseInt(m, 10) - 1]}`;
    }
    if (p.length === 7) {
        const [, num] = p.split('-');
        const n = parseInt(num, 10);
        if (n <= 12) {
            return MESES_CORTO[n - 1] || p;
        }
        return `Sem ${num}`;
    }
    return p;
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="ct-label">{formatPeriodLabel(label)}</p>
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

    const hasNegativeBalance = data.some(d => (d.balance ?? 0) < 0);

    return (
        <div className="chart-card">
            <h3 className="chart-title">Tendencia de Ingresos vs Salidas</h3>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="period"
                        tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }}
                        tickFormatter={formatPeriodLabel}
                    />
                    <YAxis tick={{ fill: 'rgba(237,232,235,0.5)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'rgba(237,232,235,0.7)', fontSize: 12 }} />
                    {hasNegativeBalance && <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />}
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
                    <Line
                        type="monotone"
                        dataKey="balance"
                        name="Balance"
                        stroke="#fdd05e"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{ r: 3, fill: '#fdd05e' }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
