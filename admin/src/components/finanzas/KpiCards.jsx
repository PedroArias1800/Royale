export const KpiCards = ({ summary, loading }) => {
    const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;

    const cards = [
        {
            label: 'Ingresos',
            value: fmt(summary?.ingresos),
            sub: `${summary?.count_ventas ?? 0} ventas`,
            color: '#2ecc71',
            icon: '↑',
        },
        {
            label: 'Salidas',
            value: fmt(summary?.salidas),
            sub: `COGS: ${fmt(summary?.cogs)}`,
            color: '#d60a5f',
            icon: '↓',
        },
        {
            label: 'Balance',
            value: fmt(summary?.balance),
            sub: summary?.balance >= 0 ? 'Positivo' : 'Negativo',
            color: summary?.balance >= 0 ? '#fdd05e' : '#d60a5f',
            icon: '≈',
        },
        {
            label: 'Margen Bruto',
            value: `${summary?.margen_bruto ?? 0}%`,
            sub: `Ventas: ${fmt(summary?.ingresos_ventas)}`,
            color: '#a78bfa',
            icon: '%',
        },
    ];

    return (
        <div className="kpi-grid">
            {cards.map((card) => (
                <div key={card.label} className="kpi-card" style={{ '--accent': card.color }}>
                    <span className="kpi-icon">{card.icon}</span>
                    <div className="kpi-body">
                        <p className="kpi-label">{card.label}</p>
                        <p className="kpi-value" style={{ color: card.color }}>
                            {loading ? '...' : card.value}
                        </p>
                        <p className="kpi-sub">{loading ? '' : card.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
