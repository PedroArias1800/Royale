import { useState } from 'react';

const PRESETS = [
    { label: 'Hoy',       key: 'today'       },
    { label: 'Semana',    key: 'week'         },
    { label: 'Mes',       key: 'month'        },
    { label: '4 Semanas', key: 'four_weeks'   },
    { label: '4 Meses',   key: 'four_months'  },
    { label: 'Año',       key: 'year'         },
    { label: 'Personalizado', key: 'custom'   },
];

function toLocalISO(date) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function getRangeForPreset(key) {
    const now = new Date();
    const today = toLocalISO(now);
    const dow = now.getDay(); // 0=Dom … 6=Sáb

    if (key === 'today') {
        return { start: today, end: today };
    }
    if (key === 'week') {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dow + 6) % 7));
        return { start: toLocalISO(monday), end: today };
    }
    if (key === 'month') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: toLocalISO(first), end: today };
    }
    if (key === 'four_weeks') {
        // Lunes de hace 3 semanas → hoy, agrupado por semana ISO
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dow + 6) % 7) - 21);
        return { start: toLocalISO(monday), end: today, granularity: 'week' };
    }
    if (key === 'four_months') {
        // Día 1 de hace 3 meses → hoy, agrupado por mes
        const first = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: toLocalISO(first), end: today, granularity: 'month' };
    }
    if (key === 'year') {
        const first = new Date(now.getFullYear(), 0, 1);
        return { start: toLocalISO(first), end: today };
    }
    return { start: today, end: today };
}

export const PeriodPicker = ({ onChange }) => {
    const [active, setActive] = useState('month');
    const [custom, setCustom] = useState({ start: '', end: '' });

    const selectPreset = (key) => {
        setActive(key);
        if (key !== 'custom') {
            onChange(getRangeForPreset(key));
        }
    };

    const handleCustomChange = (e) => {
        const updated = { ...custom, [e.target.name]: e.target.value };
        setCustom(updated);
        if (updated.start && updated.end) {
            onChange(updated);
        }
    };

    return (
        <div className="period-picker">
            <div className="period-presets">
                {PRESETS.map((p) => (
                    <button
                        key={p.key}
                        className={`period-btn${active === p.key ? ' active' : ''}`}
                        onClick={() => selectPreset(p.key)}
                        type="button"
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            {active === 'custom' && (
                <div className="period-custom">
                    <label>
                        Desde
                        <input type="date" name="start" value={custom.start} onChange={handleCustomChange} />
                    </label>
                    <label>
                        Hasta
                        <input type="date" name="end" value={custom.end} onChange={handleCustomChange} />
                    </label>
                </div>
            )}
        </div>
    );
};
