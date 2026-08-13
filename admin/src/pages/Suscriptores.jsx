import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscribersRequest, deleteSubscriberRequest } from '../api/Subscribers.api.js';

export const Suscriptores = () => {
    const navigate = useNavigate();
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const res = await getSubscribersRequest();
            setSubscribers(res.data || []);
        } catch {
            setSubscribers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSubscribers(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este suscriptor?')) return;
        try {
            await deleteSubscriberRequest(id);
            setSubscribers(prev => prev.filter(s => s._id !== id));
        } catch {
            alert('Error al eliminar el suscriptor.');
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return iso.split('T')[0];
    };

    return (
        <div className='dataContent'>
            <div className='pageHeader'>
                <div className='pageHeader1'>
                    <div className='volverAnadir'>
                        <button className='btn-volver' onClick={() => navigate('/admin')}>← Volver</button>
                    </div>
                </div>
                <div className='pageHeader-title-row'>
                    <h1>Suscriptores Newsletter</h1>
                    <span className='pageHeader-count'>
                        {subscribers.length} suscriptor{subscribers.length !== 1 ? 'es' : ''}
                    </span>
                </div>
            </div>

            {loading && <p style={{ color: 'rgba(237,232,235,0.5)', textAlign: 'center', padding: '40px' }}>Cargando suscriptores…</p>}

            {!loading && subscribers.length === 0 && (
                <div className='sinDatosParaMostrar'>
                    <h1>No hay suscriptores aún</h1>
                </div>
            )}

            {!loading && subscribers.length > 0 && (
                <table border="1" className="responsiveTable">
                    <thead>
                        <tr>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Fecha de suscripción</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscribers.map(s => (
                            <tr key={s._id}>
                                <td style={{ padding: '8px' }}>{s.email}</td>
                                <td style={{ padding: '8px' }}>{formatDate(s.createdAt)}</td>
                                <td style={{ padding: '8px' }}>
                                    <button
                                        onClick={() => handleDelete(s._id)}
                                        style={{
                                            background: 'rgba(214,10,95,0.12)', border: '1px solid rgba(214,10,95,0.4)',
                                            color: '#d60a5f', padding: '4px 12px', borderRadius: '2px',
                                            cursor: 'pointer', fontSize: '0.78rem',
                                        }}
                                    >Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
