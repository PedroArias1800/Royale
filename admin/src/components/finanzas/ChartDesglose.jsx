import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#fdd05e', '#d60a5f', '#2ecc71', '#a78bfa', '#38bdf8', '#fb923c', '#f472b6'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="chart-tooltip">
            <p style={{ color: item.payload.fill }}>{item.name}</p>
            <p>${Number(item.value).toFixed(2)} ({item.payload.type ?? ''})</p>
        </div>
    );
};

export const ChartDesglose = ({ data, loading }) => {
    if (loading) return <div className="chart-placeholder">Cargando...</div>;
    if (!data?.length) return <div className="chart-placeholder">Sin movimientos manuales en el período</div>;

    return (
        <div className="chart-card">
            <h3 className="chart-title">Desglose por Etiqueta</h3>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'rgba(237,232,235,0.7)', fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
