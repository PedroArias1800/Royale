import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    getPendingTransactionsRequest,
    getManualTransactionsRequest,
    getProcessedTransactionsRequest,
    putTransactionRequest,
    postManualTransactionRequest,
    deleteManualTransactionRequest,
} from '../api/Transaction.api.js';
import axios from '../api/axios.js';
import { PeriodPicker } from '../components/finanzas/PeriodPicker.jsx';
import { KpiCards } from '../components/finanzas/KpiCards.jsx';
import { ChartTendencia } from '../components/finanzas/ChartTendencia.jsx';
import { ChartDesglose } from '../components/finanzas/ChartDesglose.jsx';
import { ChartMetodos } from '../components/finanzas/ChartMetodos.jsx';
import { MovimientosCRUD } from '../components/finanzas/MovimientosCRUD.jsx';
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
    const [pendientes, setPendientes] = useState([]);
    const [manuales, setManuales] = useState([]);
    const [procesadas, setProcesadas] = useState([]);

    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);
    const [loadingPendientes, setLoadingPendientes] = useState(false);
    const [loadingManuales, setLoadingManuales] = useState(false);
    const [loadingProcesadas, setLoadingProcesadas] = useState(false);

    const qs = `start=${period.start}T00:00:00&end=${period.end}T23:59:59`;

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
        const granularity = days <= 31 ? 'day' : days <= 90 ? 'week' : 'month';
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
    }, [qs]);

    const loadPendientes = useCallback(async () => {
        setLoadingPendientes(true);
        try {
            const res = await getPendingTransactionsRequest();
            setPendientes(res.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingPendientes(false); }
    }, []);

    const loadManuales = useCallback(async () => {
        setLoadingManuales(true);
        try {
            const res = await getManualTransactionsRequest(period.start, period.end);
            setManuales(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingManuales(false); }
    }, [period]);

    const loadProcesadas = useCallback(async () => {
        setLoadingProcesadas(true);
        try {
            const res = await getProcessedTransactionsRequest(period.start, period.end);
            setProcesadas(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingProcesadas(false); }
    }, [period]);

    useEffect(() => {
        loadSummary();
        loadTrends();
        loadBreakdown('label');
        loadManuales();
        loadProcesadas();
    }, [period]);

    // Pendientes no depende del período
    useEffect(() => {
        loadPendientes();
    }, []);

    const handlePeriodChange = (range) => setPeriod(range);

    const handleProcess = async (id, data) => {
        try {
            await putTransactionRequest(id, data);
            loadPendientes();
            loadProcesadas();
            loadSummary();
            loadTrends();
            loadBreakdown('label');
        } catch (e) { console.error(e); }
    };

    const handleSaveManual = async (data) => {
        try {
            await postManualTransactionRequest(data);
            loadManuales();
            loadSummary();
            loadBreakdown('label');
        } catch (e) { console.error(e); }
    };

    const handleDeleteManual = async (id) => {
        try {
            await deleteManualTransactionRequest(id);
            loadManuales();
            loadSummary();
            loadBreakdown('label');
        } catch (e) { console.error(e); }
    };

    // Revertir procesada → status:1 (pendiente)
    const handleRevert = async (id) => {
        if (!confirm('¿Revertir esta transacción a pendiente?')) return;
        try {
            await putTransactionRequest(id, { status: 1 });
            loadProcesadas();
            loadPendientes();
            loadSummary();
            loadTrends();
            loadBreakdown('label');
        } catch (e) { console.error(e); }
    };

    // Omitir / incluir en estadísticas sin eliminar
    const handleToggleOmit = async (id, omitted) => {
        try {
            await putTransactionRequest(id, { omitted });
            // Actualizar estado local sin recargar para feedback inmediato
            setProcesadas(prev => prev.map(t => t._id === id ? { ...t, omitted } : t));
            loadSummary();
            loadTrends();
            loadBreakdown('label');
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

            <MovimientosCRUD
                pendientes={pendientes}
                manuales={manuales}
                procesadas={procesadas}
                onProcess={handleProcess}
                onSaveManual={handleSaveManual}
                onDeleteManual={handleDeleteManual}
                onRevert={handleRevert}
                onToggleOmit={handleToggleOmit}
                loadingPendientes={loadingPendientes}
                loadingManuales={loadingManuales}
                loadingProcesadas={loadingProcesadas}
            />
        </div>
    );
};
