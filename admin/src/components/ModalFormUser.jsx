import { postUsersRequest, putUsersRequest } from '../api/User.api.js';
import { useAuth } from '../context/AuthProvider';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

export const ModalFormUser = ({ modalData }) => {
    const { setModalData, cargarDataTables, closeModal, showAlert, user } = useAuth();
    const isUpdate = Boolean(modalData?._id); // Identificar si es una actualización

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setModalData((prevData) => ({
            ...prevData,
            [name]: convertType(name, value),
        }));
    };

    const convertType = (name, value) => {
        const integerFields = ['gender', 'status'];
        return integerFields.includes(name) ? parseInt(value, 10) : value;
    };

    const handleRoleCheckbox = (roleId) => {
        const currentRoles = Array.isArray(modalData?.roles) ? modalData.roles : [modalData?.rol].filter(Boolean);
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter(r => r !== roleId)
            : [...currentRoles, roleId];
        if (newRoles.length === 0) return;
        const primaryRol = newRoles.includes(1) ? 1 : newRoles.includes(2) ? 2 : 3;
        setModalData(prev => ({ ...prev, roles: newRoles, rol: primaryRol }));
    };

    const currentRoles = Array.isArray(modalData?.roles) ? modalData.roles : [modalData?.rol].filter(Boolean);

    const enviarDatos = async (e) => {
        e.preventDefault();
        try {
            if (isUpdate) {
                // Llamar a la API de actualización
                const res = await putUsersRequest(modalData._id, modalData);
                if (res.status == 200){
                    showAlert('Datos actualizados con éxito', 1);
                    cargarDataTables(6)
                    closeModal()
                }
            } else {
                // Llamar a la API de creación
                const res = await postUsersRequest(modalData);
                if (res.status == 200){
                    showAlert('Datos creados con éxito', 1);
                    cargarDataTables(6)
                    closeModal()
                }
            }
            setModalData(null); // Limpiar los datos del modal
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        }
    };

    const deleteDatos = async () => {
        // try {
        //     const res = await deleteVersionsRequest(modalData?._id);
        //     if (res.status == 200){
        //         showAlert('Datos eliminados con éxito', 1);
        //     } else if (res.status == 202) {
        //         showAlert(res.data.message);
        //     } else {
        //         showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        //     }
        // } catch (error) {
        //     console.error('Error al eliminar los datos:', error);
        //     showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        // }
        
        closeModal()
        setModalData(null);
        cargarDataTables(6)
    }

    if (!modalData) {
        return <p>Cargando datos...</p>; // Mostrar algo mientras `modalData` no esté disponible
    }

    return (
        <form onSubmit={enviarDatos}>
            <input type="hidden" name="_id" value={modalData?._id || ''} onChange={handleInputChange} required={true} />
            <div className="form-group3">
                <label htmlFor="firstname">
                    <p>Nombre</p>
                    <input type="text" name="firstname" id="firstname" value={modalData?.firstname || ''} onChange={handleInputChange} required={true} />
                </label>
                <label htmlFor="lastname">
                    <p>Apellido</p>
                    <input type="text" name="lastname" id="lastname" value={modalData?.lastname || ''} onChange={handleInputChange} required={true} />
                </label>
            </div>
            <div className="form-group3">
                <label htmlFor="email">
                    <p>Correo</p>
                    <input type="text" name="email" id="email" value={modalData?.email || ''} onChange={handleInputChange} required={true}  />
                </label>
                <label htmlFor="password">
                    <p>Contraseña</p>
                    <input type="password" name="password" id="password" value={user.rol == 1 ? modalData?.password : ''} onChange={handleInputChange} placeholder='**********' required={!isUpdate} disabled={user.rol == 1 ? false : true} />
                </label>
            </div>
            <div className="form-group3">
                {
                    (user.rol == 1) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'rgba(237,232,235,0.6)', letterSpacing: '0.04em' }}>Roles</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 1, label: 'Admin', color: '#d60a5f' },
                                    { id: 2, label: 'Vendedor', color: '#fdd05e' },
                                    { id: 3, label: 'Delivery', color: '#1BAEE8' },
                                ].map(role => {
                                    const active = currentRoles.includes(role.id);
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleRoleCheckbox(role.id)}
                                            style={{
                                                padding: '5px 14px',
                                                borderRadius: '20px',
                                                border: `1.5px solid ${active ? role.color : 'rgba(237,232,235,0.2)'}`,
                                                background: active ? `${role.color}22` : 'transparent',
                                                color: active ? role.color : 'rgba(237,232,235,0.45)',
                                                fontSize: '0.78rem',
                                                fontWeight: active ? '600' : '400',
                                                cursor: 'pointer',
                                                transition: 'all 0.18s',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            {active ? '✓ ' : ''}{role.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }
                <label htmlFor="status">
                    <p>Estado</p>
                    <select
                        name="status"
                        id="status"
                        value={modalData?.status !== undefined ? modalData?.status : ''}
                        onChange={handleInputChange}
                        required={true}
                        disabled={user.rol != 1}
                    >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                </label>
            </div>
            <div className='btnBorrarCrear' style={{justifyContent: isUpdate ? 'space-between' : 'right'}}>
                {isUpdate && <ConfirmDeleteButton onConfirm={deleteDatos} />}
                <input type="submit" value={isUpdate ? 'Actualizar' : 'Crear'} className='btnActualizarCrear' />
            </div>
        </form>
    );
};
