import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios.js';
import { getProcessedTransactionsRequest, putTransactionRequest, getAccountTransactionsRequest, postAccountPaymentRequest, deleteManualTransactionRequest } from '../api/Transaction.api.js';
import { PeriodPicker } from '../components/finanzas/PeriodPicker.jsx';
import { KpiCards } from '../components/finanzas/KpiCards.jsx';
import { ChartTendencia } from '../components/finanzas/ChartTendencia.jsx';
import { ChartDesglose } from '../components/finanzas/ChartDesglose.jsx';
import { ChartMetodos } from '../components/finanzas/ChartMetodos.jsx';
import { ChartTopParfums } from '../components/finanzas/ChartTopParfums.jsx';
import { FinanzasMovimientos } from '../components/finanzas/MovimientosCRUD.jsx';
import '../css/Finanzas.css';

function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function firstOfMonthISO() {
    const d = new Date();
    d.setDate(1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

export const Finanzas = () => {
    const [period, setPeriod] = useState({ start: firstOfMonthISO(), end: todayISO() });
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [breakdown, setBreakdown] = useState([]);

    const [procesadas, setProcesadas] = useState([]);
    const [loadingProcesadas, setLoadingProcesadas] = useState(false);
    const [cuentas, setCuentas] = useState([]);
    const [loadingCuentas, setLoadingCuentas] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Panamá = UTC-5 (sin DST). Se incluye el offset para que el backend filtre correctamente.
    const qs = `start=${period.start}T00:00:00-05:00&end=${period.end}T23:59:59-05:00`;

    const loadSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await axios.get(`/api/analytics/summary?${qs}`);
            setSummary(res.data);
        } catch (e) { console.error(e); }
        finally { setLoadingSummary(false); }
    }, [qs]);

    const loadTrends = useCallback(async () => {
        setLoadingTrends(true);
        const days = Math.round((new Date(period.end) - new Date(period.start)) / 86400000);
        const granularity = period.granularity || (days <= 31 ? 'day' : days <= 90 ? 'week' : 'month');
        try {
            const res = await axios.get(`/api/analytics/trends?${qs}&granularity=${granularity}`);
            setTrends(res.data);
        } catch (e) { console.error(e); }
        finally { setLoadingTrends(false); }
    }, [qs, period]);

    const loadBreakdown = useCallback(async (by = 'label') => {
        setLoadingBreakdown(true);
        try {
            const res = await axios.get(`/api/analytics/breakdown?${qs}&by=${by}`);
            setBreakdown(res.data);
            return res.data;
        } catch (e) { console.error(e); return []; }
        finally { setLoadingBreakdown(false); }
    }, [qs, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadTopProducts = useCallback(async () => {
        try {
            const res = await axios.get(`/api/analytics/top-products?${qs}&limit=10`);
            return res.data;
        } catch (e) { console.error(e); return []; }
    }, [qs, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadProcesadas = useCallback(async () => {
        setLoadingProcesadas(true);
        try {
            const res = await getProcessedTransactionsRequest(period.start, period.end);
            setProcesadas(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingProcesadas(false); }
    }, [period.start, period.end]);

    const loadCuentas = useCallback(async () => {
        setLoadingCuentas(true);
        try {
            const res = await getAccountTransactionsRequest();
            setCuentas(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingCuentas(false); }
    }, []);

    useEffect(() => {
        loadSummary();
        loadTrends();
        loadBreakdown('label');
        loadProcesadas();
        loadCuentas();
    }, [period]);

    const handlePeriodChange = (range) => setPeriod(range);

    const handleToggleOmit = async (tx_id, omitted) => {
        try {
            await putTransactionRequest(tx_id, { omitted });
            setProcesadas(prev => prev.map(t => t._id === tx_id ? { ...t, omitted } : t));
            setCuentas(prev => prev.map(c => c._id === tx_id ? { ...c, omitted } : c));
            setRefreshKey(k => k + 1);
            loadSummary();
            loadTrends();
        } catch (e) { console.error(e); }
    };

    const handleAbonar = async (tx_id, data) => {
        try {
            await postAccountPaymentRequest(tx_id, data);
            loadCuentas();
            loadSummary();
            loadTrends();
        } catch (e) { console.error(e); }
    };

    const handleDeleteCuenta = async (tx_id) => {
        if (!confirm('¿Eliminar esta cuenta permanentemente?')) return;
        try {
            await deleteManualTransactionRequest(tx_id);
            loadCuentas();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="finanzas-page">
            <div className="finanzas-header">
                <div className="finanzas-title-row">
                    <div className="volverAnadir">
                        <Link to="/admin" className="btn-volver">← Volver</Link>
                    </div>
                    <h1 className="finanzas-title">Finanzas</h1>
                </div>
                <PeriodPicker onChange={handlePeriodChange} />
            </div>

            <KpiCards summary={summary} loading={loadingSummary} />

            <div className="charts-row">
                <ChartTendencia data={trends} loading={loadingTrends} />
                <ChartDesglose data={breakdown} loading={loadingBreakdown} />
            </div>

            <ChartMetodos fetchBreakdown={loadBreakdown} loading={loadingBreakdown} />

            <ChartTopParfums fetchTopProducts={loadTopProducts} loading={false} />

            <div className="finanzas-movimientos-section">
                <h2 className="finanzas-section-title">Transacciones del Período</h2>
                <FinanzasMovimientos
                    procesadas={procesadas} loading={loadingProcesadas} onToggleOmit={handleToggleOmit}
                    cuentas={cuentas} loadingCuentas={loadingCuentas}
                />
            </div>
        </div>
    );
};
